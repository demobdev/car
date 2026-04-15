import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.PRINTFUL_API_TOKEN || process.env.VITE_PRINTFUL_API_TOKEN || "";
  if (!token) return res.status(500).json({ error: "Missing PRINTFUL_API_TOKEN" });

  // Get everything after /api/printful/
  const { path } = req.query;
  const subPath = Array.isArray(path) ? path.join("/") : path || "";
  const qs = new URL(req.url || "", `https://${req.headers.host}`).search;
  const url = `https://api.printful.com/${subPath}${qs}`;

  const opts: RequestInit = {
    method: req.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (["POST", "PUT", "PATCH"].includes(req.method || "")) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    opts.body = Buffer.concat(chunks).toString();
  }

  try {
    const pfRes = await fetch(url, opts);
    const ct = pfRes.headers.get("content-type");
    const body = await pfRes.text();

    res.setHeader("Content-Type", ct || "application/json");
    res.status(pfRes.status).send(body);
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
}
