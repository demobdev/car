// Minimal test — no hono, no stripe, no dependencies
export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: "ok", 
    time: new Date().toISOString(),
    path: req.url,
    env_check: {
      has_stripe: !!process.env.STRIPE_SECRET_KEY,
      has_printful: !!(process.env.PRINTFUL_API_TOKEN || process.env.VITE_PRINTFUL_API_TOKEN),
      has_supabase: !!(process.env.VITE_SUPABASE_URL),
    }
  });
}
