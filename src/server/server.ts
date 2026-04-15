import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";
import Stripe from "stripe";

// Helper for universal environment access (Bun vs Node/Vercel)
const getEnv = (key: string): string => {
  return (globalThis as any).Bun?.env?.[key] || (globalThis as any).process?.env?.[key] || "";
};

const stripe = new Stripe(getEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-04-10",
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

// 1. SECURE PRINTFUL PROXY (ROBUST PARAMETER ROUTING)
// This captures everything after /api/printful/ and forwards it to Printful.
app.all("/api/printful/:path{.*}", async (c) => {
  const token = getEnv("PRINTFUL_API_TOKEN");
  if (!token) return c.json({ error: "Printful configuration missing" }, 500);

  const subPath = c.req.param("path");
  const query = c.req.url.split("?")[1] || "";
  const url = `https://api.printful.com/${subPath}${query ? "?" + query : ""}`;

  console.log(`[Proxy] Forwarding to Printful: ${url}`);

  const options: RequestInit = {
    method: c.req.method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (["POST", "PUT", "PATCH"].includes(c.req.method)) {
    options.body = await c.req.text();
  }

  try {
    const pfRes = await fetch(url, options);
    const contentType = pfRes.headers.get("content-type");
    
    if (contentType?.includes("application/json")) {
      const data = await pfRes.json();
      return c.json(data, pfRes.status as any);
    }
    const text = await pfRes.text();
    return c.text(text, pfRes.status as any);
  } catch (err: any) {
    console.error("[Proxy Error]:", err.message);
    return c.json({ error: "Upstream failure", detail: err.message }, 502);
  }
});

// Use a getter for stripe to ensure env is fully loaded
let stripeInstance: Stripe | null = null;
const getStripe = () => {
  const key = getEnv("STRIPE_SECRET_KEY");
  if (!stripeInstance) {
    stripeInstance = new Stripe(key, { apiVersion: "2024-04-10" });
  }
  return stripeInstance;
};

app.post("/api/checkout", async (c) => {
  try {
    const body = await c.req.json();
    const { variantId, designUrl, title, amountAuth } = body;
    const unitAmount = Math.round(parseFloat(amountAuth) * 100);
    const origin = c.req.header("origin") || "http://localhost:5173";

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card", "link"],
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
      metadata: { variantId: variantId.toString(), designUrl },
      mode: "payment",
      success_url: `${origin}?success=true`,
      cancel_url: `${origin}`,
    });

    return c.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe] Checkout Error:", err);
    return c.json({ error: err.message }, 500);
  }
});

app.post("/api/webhooks/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  const webhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");
  if (!signature) return c.text("Bad Request", 400);

  const rawBody = await c.req.text();
  let event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return c.text(`Webhook Error`, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { variantId, designUrl } = session.metadata;
    const shipping = session.shipping_details;
    
    // ... fulfillment logic (Printful, Resend, Supabase) using getEnv() ...
    // Note: ensure fulfillment calls in webhook use getEnv() as well
    // (Truncated for readability, but implementation will use getEnv keys)
    console.log(`[Stripe Webhook] Received payment for ${session.customer_details.email}`);
    
    // 1. SUPABASE GALLERY
    try {
      const sbUrl = getEnv("VITE_SUPABASE_URL");
      const sbKey = getEnv("VITE_SUPABASE_ANON_KEY");
      if (sbUrl && sbKey) {
        await fetch(`${sbUrl}/rest/v1/community_designs`, {
          method: "POST",
          headers: { "apikey": sbKey, "Authorization": `Bearer ${sbKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ location: session.metadata.title || "Custom Design", image_url: designUrl, theme: "Premium" })
        });
      }
    } catch (e) {}

    // 2. PRINTFUL FULFILLMENT
    try {
      const pfToken = getEnv("PRINTFUL_API_TOKEN");
      const recipient = { 
        name: shipping.name, 
        address1: shipping.address.line1, 
        city: shipping.address.city, 
        state_code: shipping.address.state, 
        country_code: shipping.address.country, 
        zip: shipping.address.postal_code 
      };

      const pfRes = await fetch("https://api.printful.com/v2/orders", {
        method: "POST",
        headers: { "Authorization": `Bearer ${pfToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, order_items: [{ source: "catalog", catalog_variant_id: parseInt(variantId, 10), quantity: 1, placements: [{ placement: "default", technique: "digital", layers: [{ type: "file", url: designUrl }] }] }] })
      });
      
      const pfData = await pfRes.json();
      if (pfRes.ok) {
        await fetch(`https://api.printful.com/v2/orders/${pfData.data.id}/confirm`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${pfToken}`, "Content-Type": "application/json" }
        });
      }
    } catch (e) {}

    // 3. RESEND EMAIL
    try {
      const resendKey = getEnv("RESEND_API_KEY");
      if (resendKey) {
        await fetch(`https://api.resend.com/emails`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Cartographica <studio@cartographica.app>",
            to: [session.customer_details.email],
            subject: "Your Custom Map is in Production! 🗺️",
            html: `<p>Hello ${session.customer_details.name}, your map for ${session.metadata.title} is being printed!</p>`
          })
        });
      }
    } catch (e) {}
  }

  return c.json({ received: true });
});

// Export for Vercel / Node compat
export const GET = handle(app);
export const POST = handle(app);
export const OPTIONS = handle(app);

// Export app instance for external handlers
export { app };

// Local Bun compat
export default {
  port: 3001,
  fetch: app.fetch,
};
