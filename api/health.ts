import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
    env: {
      has_stripe: !!process.env.STRIPE_SECRET_KEY,
      has_printful: !!(process.env.PRINTFUL_API_TOKEN || process.env.VITE_PRINTFUL_API_TOKEN),
      has_supabase: !!process.env.VITE_SUPABASE_URL,
    },
  });
}
