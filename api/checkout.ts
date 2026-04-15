import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const getStripe = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2026-03-25.dahlia" as any,
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { variantId, designUrl, title, amountAuth } = req.body;
    const unitAmount = Math.round(parseFloat(amountAuth) * 100);
    const origin = req.headers.origin || "https://car-sigma-five.vercel.app";

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card", "link"],
      shipping_address_collection: {
        allowed_countries: ["US","CA","GB","AU","DE","FR","ES","IT","NL","BE","AT","DK","SE","NO","FI"],
      },
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: title || "Custom Cartographica Map",
            images: designUrl?.startsWith("http") ? [designUrl] : [],
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      metadata: { variantId: String(variantId), designUrl },
      mode: "payment",
      success_url: `${origin}?success=true`,
      cancel_url: origin,
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
