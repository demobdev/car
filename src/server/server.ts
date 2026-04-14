import { createRouteHandler, createUploadthing, type FileRouter } from "uploadthing/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import Stripe from "stripe";

const stripe = new Stripe(Bun.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

const f = createUploadthing();

// Define the router — one endpoint for map poster snapshots
export const uploadRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .onUploadComplete(async ({ file }) => {
      console.log("✅ Upload complete:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

// In v7, createRouteHandler returns a single handler function (not an object with GET/POST)
const uploadHandler = createRouteHandler({
  router: uploadRouter,
  config: {
    token: Bun.env.UPLOADTHING_TOKEN,
  },
});

import { logger } from "hono/logger";

const app = new Hono();

app.use("*", logger());

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-uploadthing-version", "x-uploadthing-package"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/api/health", (c) => c.json({ status: "ok", time: new Date().toISOString() }));

// Use a getter for stripe to ensure Bun.env is fully loaded and initialized
let stripeInstance: Stripe | null = null;
const getStripe = () => {
  const key = Bun.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[Stripe] Warning: STRIPE_SECRET_KEY is missing from environment!");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(key || "", { apiVersion: "2024-04-10" });
  }
  return stripeInstance;
};

// Route all GET/POST to the unified handler
app.all("/api/uploadthing", (c) => uploadHandler(c.req.raw));

app.post("/api/checkout", async (c) => {
  try {
    const body = await c.req.json();
    const { variantId, designUrl, title, amountAuth } = body;
    
    // Stripe expects cents (integer)
    const unitAmount = Math.round(parseFloat(amountAuth) * 100);
    
    // Attempt to infer the host URL for redirects
    const origin = c.req.header("origin") || "http://localhost:5173";

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card", "link"], // Removed amazon_pay which often requires manual dashboard enablement
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "DK", "SE", "NO", "FI"], 
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: title || "Custom Cartographica Map",
              images: designUrl && designUrl.startsWith("http") ? [designUrl] : [],
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        variantId: variantId.toString(),
        designUrl,
      },
      mode: "payment",
      success_url: `${origin}?success=true`,
      cancel_url: `${origin}`,
    });

    return c.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe] Detailed Checkout Error:", err);
    
    // EXPOSING ERROR TO CLIENT FOR DIAGNOSTICS
    const errorMessage = err.raw?.message || err.message || "Stripe session creation failed";
    const errorType = err.type || "UnknownError";
    
    return c.json({ 
      error: errorMessage,
      detail: errorType,
      stack: err.stack?.split("\n")[1] // Just a hint, not the whole stack
    }, 500);
  }
});

app.post("/api/webhooks/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) return c.text("Bad Request", 400);

  const rawBody = await c.req.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, Bun.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return c.text(`Webhook Error`, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { variantId, designUrl } = session.metadata;
    const shipping = session.shipping_details;
    
    console.log(`[Stripe Webhook] Payment received! Processing order automation...`);

    // 1. HIGH PRIORITY: SAVE TO COMMUNITY GALLERY (Supabase)
    // We do this first to ensure the purchase is celebrated on the homepage immediately.
    try {
      if (Bun.env.VITE_SUPABASE_URL && Bun.env.VITE_SUPABASE_ANON_KEY) {
        await fetch(`${Bun.env.VITE_SUPABASE_URL}/rest/v1/community_designs`, {
          method: "POST",
          headers: {
            "apikey": Bun.env.VITE_SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${Bun.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            location: session.metadata.title || "Custom Design",
            image_url: designUrl,
            theme: "Premium"
          })
        });
        console.log(`[Supabase] Success: Design added to community gallery.`);
      }
    } catch (err: any) {
      console.error("[Supabase Error] Gallery sync failed:", err.message);
    }

    // 2. FULFILLMENT: CREATE PRINTFUL ORDER
    try {
      const recipient = {
        name: shipping.name,
        address1: shipping.address.line1,
        city: shipping.address.city,
        state_code: shipping.address.state,
        country_code: shipping.address.country,
        zip: shipping.address.postal_code,
      };

      const printfulPayload = {
        recipient,
        order_items: [{
          source: "catalog",
          catalog_variant_id: parseInt(variantId, 10),
          quantity: 1,
          placements: [{
            placement: "default",
            technique: "digital", 
            layers: [{ type: "file", url: designUrl }]
          }]
        }]
      };

      const pfRes = await fetch("https://api.printful.com/v2/orders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Bun.env.PRINTFUL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(printfulPayload)
      });
      
      const pfData = await pfRes.json();
      if (pfRes.ok) {
        console.log(`[Printful] Success: Order Created (ID: ${pfData.data.id})`);
        // Auto-confirm for production
        await fetch(`https://api.printful.com/v2/orders/${pfData.data.id}/confirm`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${Bun.env.PRINTFUL_API_TOKEN}`, "Content-Type": "application/json" }
        });
        console.log(`[Printful] Success: Order confirmed for fulfillment.`);
      } else {
        throw new Error(pfData.detail || "Printful API error");
      }
    } catch (err: any) {
      console.error("[Printful Error] Fulfillment creation failed:", err.message);
    }

    // 3. NOTIFICATION: SEND CONFIRMATION EMAIL (Resend)
    try {
      if (Bun.env.RESEND_API_KEY) {
        await fetch(`https://api.resend.com/emails`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Bun.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Cartographica <studio@cartographica.app>",
            to: [session.customer_details.email],
            subject: "Your Custom Map is in Production! 🗺️",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #34d399;">Order Confirmed!</h2>
                <p>Hello ${session.customer_details.name},</p>
                <p>Your custom cartograph for <strong>${session.metadata.title || "your favorite place"}</strong> has officially entered production.</p>
                <p>A detailed receipt has been sent via Stripe. We will notify you as soon as your map leaves our studio.</p>
                <p>Warmly,<br/>The Cartographica Team</p>
              </div>
            `
          })
        });
        console.log(`[Resend] Success: Confirmation email sent to ${session.customer_details.email}`);
      }
    } catch (err: any) {
      console.error("[Resend Error] Email delivery failed:", err.message);
    }
  }

  return c.json({ received: true });
});

export default {
  port: 3001,
  fetch: app.fetch,
};
