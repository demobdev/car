import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const getStripe = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2026-03-25.dahlia" as any,
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!sig || !secret) return res.status(400).send("Bad Request: Missing signature or secret");

  let event;
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const rawBody = Buffer.concat(chunks).toString("utf8");
    
    event = getStripe().webhooks.constructEvent(rawBody, sig as string, secret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { variantId, designUrl } = session.metadata;
    const shipping = session.shipping_details;

    console.log(`[Webhook] Payment from ${session.customer_details?.email}`);

    // Supabase Gallery
    try {
      const sbUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const sbKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      if (sbUrl && sbKey) {
        await fetch(`${sbUrl}/rest/v1/community_designs`, {
          method: "POST",
          headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ location: session.metadata.title || "Custom Design", image_url: designUrl, theme: "Premium" }),
        });
      }
    } catch (err) {
      console.error("Supabase sync failed:", err);
    }

    // Printful Fulfillment
    try {
      const pfToken = process.env.PRINTFUL_API_TOKEN || process.env.VITE_PRINTFUL_API_TOKEN;
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
        if (pfRes.ok && pfData.data?.id) {
          await fetch(`https://api.printful.com/v2/orders/${pfData.data.id}/confirm`, {
            method: "POST",
            headers: { Authorization: `Bearer ${pfToken}`, "Content-Type": "application/json" },
          });
        } else {
           console.error("Printful order creation failed:", pfData);
        }
      }
    } catch (err) {
      console.error("Printful fulfillment failed:", err);
    }

    // Resend Email
    try {
      const resendKey = process.env.RESEND_API_KEY;
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
    } catch (err) {
      console.error("Resend email failed:", err);
    }
  }

  res.status(200).json({ received: true });
}
