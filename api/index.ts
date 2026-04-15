import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";
import { logger } from "hono/logger";
import Stripe from "stripe";

// Universal env access
const getEnv = (key: string): string => {
  const env = process.env;
  return env[key] || env[`VITE_${key}`] || "";
};

// Lazy Stripe
let stripeInstance: Stripe | null = null;
const getStripe = () => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(getEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-03-25.dahlia" as any,
    });
  }
  return stripeInstance;
};

const app = new Hono();

app.use("*", logger());
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    maxAge: 600,
  })
);

// Health check
app.get("/api/health", (c) =>
  c.json({ status: "ok", time: new Date().toISOString() })
);

// Printful Proxy
app.all("/api/printful/:path{.*}", async (c) => {
  const token = getEnv("PRINTFUL_API_TOKEN");
  if (!token) return c.json({ error: "Missing PRINTFUL_API_TOKEN" }, 500);

  const subPath = c.req.param("path");
  const qs = c.req.url.split("?")[1] || "";
  const url = `https://api.printful.com/${subPath}${qs ? "?" + qs : ""}`;

  const opts: RequestInit = {
    method: c.req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (["POST", "PUT", "PATCH"].includes(c.req.method)) {
    opts.body = await c.req.text();
  }

  try {
    const res = await fetch(url, opts);
    const ct = res.headers.get("content-type");
    if (ct?.includes("application/json")) {
      return c.json(await res.json(), res.status as any);
    }
    return c.text(await res.text(), res.status as any);
  } catch (err: any) {
    return c.json({ error: err.message }, 502);
  }
});

// Stripe Checkout
app.post("/api/checkout", async (c) => {
  try {
    const { variantId, designUrl, title, amountAuth } = await c.req.json();
    const unitAmount = Math.round(parseFloat(amountAuth) * 100);
    const origin = c.req.header("origin") || "https://car-sigma-five.vercel.app";

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card", "link"],
      shipping_address_collection: {
        allowed_countries: [
          "US","CA","GB","AU","DE","FR","ES","IT","NL","BE","AT","DK","SE","NO","FI",
        ],
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: title || "Custom Cartographica Map",
              images: designUrl?.startsWith("http") ? [designUrl] : [],
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: { variantId: String(variantId), designUrl },
      mode: "payment",
      success_url: `${origin}?success=true`,
      cancel_url: origin,
    });

    return c.json({ url: session.url });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Stripe Webhook
app.post("/api/webhooks/stripe", async (c) => {
  const sig = c.req.header("stripe-signature");
  const secret = getEnv("STRIPE_WEBHOOK_SECRET");
  if (!sig) return c.text("Bad Request", 400);

  const raw = await c.req.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    return c.text("Webhook Error", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { variantId, designUrl } = session.metadata;
    const shipping = session.shipping_details;

    console.log(`[Webhook] Payment from ${session.customer_details?.email}`);

    // Supabase Gallery
    try {
      const sbUrl = getEnv("SUPABASE_URL");
      const sbKey = getEnv("SUPABASE_ANON_KEY");
      if (sbUrl && sbKey) {
        await fetch(`${sbUrl}/rest/v1/community_designs`, {
          method: "POST",
          headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ location: session.metadata.title || "Custom Design", image_url: designUrl, theme: "Premium" }),
        });
      }
    } catch {}

    // Printful Fulfillment
    try {
      const pfToken = getEnv("PRINTFUL_API_TOKEN");
      if (pfToken && shipping) {
        const pfRes = await fetch("https://api.printful.com/v2/orders", {
          method: "POST",
          headers: { Authorization: `Bearer ${pfToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: {
              name: shipping.name,
              address1: shipping.address.line1,
              city: shipping.address.city,
              state_code: shipping.address.state,
              country_code: shipping.address.country,
              zip: shipping.address.postal_code,
            },
            order_items: [{ source: "catalog", catalog_variant_id: parseInt(variantId, 10), quantity: 1, placements: [{ placement: "default", technique: "digital", layers: [{ type: "file", url: designUrl }] }] }],
          }),
        });
        const pfData = await pfRes.json();
        if (pfRes.ok) {
          await fetch(`https://api.printful.com/v2/orders/${pfData.data.id}/confirm`, {
            method: "POST",
            headers: { Authorization: `Bearer ${pfToken}`, "Content-Type": "application/json" },
          });
        }
      }
    } catch {}

    // Resend Email
    try {
      const resendKey = getEnv("RESEND_API_KEY");
      if (resendKey && session.customer_details?.email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Cartographica <studio@cartographica.app>",
            to: [session.customer_details.email],
            subject: "Your Custom Map is in Production! 🗺️",
            html: `<p>Hello ${session.customer_details.name}, your map is being printed!</p>`,
          }),
        });
      }
    } catch {}
  }

  return c.json({ received: true });
});

export default handle(app);
