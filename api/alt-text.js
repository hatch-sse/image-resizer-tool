const MAX_IMAGE_DATA_CHARS = 2_000_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const rateLimitBuckets = globalThis.__altTextRateLimitBuckets || new Map();
globalThis.__altTextRateLimitBuckets = rateLimitBuckets;

function getAllowedOrigins(req) {
  const configured = String(process.env.ALLOWED_ORIGINS || process.env.SITE_ORIGIN || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

  const hostOrigins = req.headers.host
    ? [`https://${req.headers.host}`, `http://${req.headers.host}`]
    : [];
  return new Set([...configured, ...hostOrigins].filter(Boolean));
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins(req);

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (!origin) return true;
  if (!allowedOrigins.has(origin)) return false;

  res.setHeader("Access-Control-Allow-Origin", origin);
  return true;
}

function isRateLimited(req) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "");
  const ip = forwardedFor.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  bucket.count += 1;
  rateLimitBuckets.set(ip, bucket);

  for (const [key, value] of rateLimitBuckets) {
    if (now > value.resetAt) rateLimitBuckets.delete(key);
  }

  return bucket.count > RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  const corsAllowed = applyCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(corsAllowed ? 200 : 403).end();
  }

  if (!corsAllowed) {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({ error: "Too many alt text requests. Please wait a minute and try again." });
  }

  const { imageData, mimeType = "image/jpeg" } = req.body || {};

  if (!imageData || typeof imageData !== "string") {
    return res.status(400).json({ error: "No image data provided." });
  }

  if (imageData.length > MAX_IMAGE_DATA_CHARS) {
    return res.status(413).json({ error: "Image data is too large." });
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return res.status(400).json({ error: "Unsupported image type." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
  }

  let geminiRes;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Write one sentence of alt text, maximum 16 words. Describe the main visible subject and action only. Be clear and factual. Do not start with 'Image of' or 'Photo of'. Do not include anything not clearly visible. Return only the alt text."
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageData
                  }
                }
              ]
            }
          ]
        })
      }
    );
  } catch (e) {
    return res.status(502).json({ error: "Could not reach the Gemini API." });
  }

  if (!geminiRes.ok) {
    let details = "";
    try {
      details = await geminiRes.text();
    } catch (e) {
      details = "Could not read Gemini error response.";
    }

    console.error("Gemini API error:", geminiRes.status, details);

    return res.status(502).json({
      error: `Gemini error ${geminiRes.status}`,
      details
    });
  }

  const data = await geminiRes.json();
  const altText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!altText) {
    return res.status(502).json({ error: "No alt text returned by Gemini." });
  }

  return res.status(200).json({ altText });
}
