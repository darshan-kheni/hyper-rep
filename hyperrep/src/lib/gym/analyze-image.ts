const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Fallback chain — each model has separate free tier quotas
const MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
];

const PROMPT = `You are a fitness coach's vision assistant. Analyze this image in the context of fitness, nutrition, and training. Describe what you see in detail, focusing on:

- If it's a FOOD/MEAL photo: identify the foods, estimate calories and macros (protein, carbs, fats), and note if it's good for muscle building or cutting.
- If it's a PHYSIQUE/BODY photo: describe the physique, note visible muscle development, body fat estimate, and areas of strength or improvement.
- If it's an EXERCISE/FORM photo: identify the exercise, analyze the form, point out what's correct and what needs fixing.
- If it's a SUPPLEMENT/PRODUCT photo: identify the product, list key ingredients, and note if it's worth using.
- If it's a GYM/EQUIPMENT photo: identify the equipment and suggest exercises that can be done with it.
- If it's something else: describe it and relate it to fitness if possible.

Be specific and detailed. This description will be used by an AI coach to give personalized advice.`;

export async function analyzeImage(base64Image: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Detect mime type from base64 header or default to jpeg
  let mimeType = "image/jpeg";
  if (base64Image.startsWith("/9j/")) mimeType = "image/jpeg";
  else if (base64Image.startsWith("iVBOR")) mimeType = "image/png";
  else if (base64Image.startsWith("R0lGO")) mimeType = "image/gif";
  else if (base64Image.startsWith("UklGR")) mimeType = "image/webp";

  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: base64Image } },
        ],
      },
    ],
  });

  let lastError = "";

  for (const model of MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) return content;
      lastError = "No analysis returned from Gemini";
      continue;
    }

    // If rate limited (429), try next model
    if (response.status === 429) {
      lastError = `${model} rate limited`;
      continue;
    }

    // Other errors — still try next model
    const text = await response.text();
    lastError = `${model}: ${response.status} — ${text}`;
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
}
