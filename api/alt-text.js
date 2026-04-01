export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
  }

  const { imageData, mimeType = "image/jpeg" } = req.body || {};

  if (!imageData) {
    return res.status(400).json({ error: "No image data provided." });
  }

  let geminiRes;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Write concise alt text for this image suitable for use on a website. Describe what is visually present in a single sentence. Do not start with 'Image of' or 'Photo of'. Be specific and descriptive. Respond with only the alt text, nothing else."
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
      details = await geminiRes.json();
    } catch (e) {
      details = await geminiRes.text().catch(() => "");
    }
    return res.status(502).json({ error: `Gemini error ${geminiRes.status}`, details });
  }

  const data = await geminiRes.json();
  const altText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!altText) {
    return res.status(502).json({ error: "No alt text returned by Gemini." });
  }

  return res.status(200).json({ altText });
}
