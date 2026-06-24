const API_KEY = process.env.GEMINI_API_KEY;

export async function autoTranslateText(text: string | null | undefined): Promise<string> {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      // Already translated structure
      JSON.parse(trimmed);
      return trimmed;
    } catch (_) {
      // Fall through if not valid JSON
    }
  }

  if (!API_KEY) {
    console.warn("Warning: GEMINI_API_KEY environment variable is not set. Skipping auto-translation.");
    return JSON.stringify({ en: text, id: text });
  }

  const prompt = `Identify the language of the following input text. If it is English, translate it to Indonesian (Bahasa Indonesia). If it is Indonesian, translate it to English. 
Return the result in this exact JSON structure: {"en": "<english_text>", "id": "<indonesian_text>"}. Return ONLY the JSON object. Do not wrap in markdown code blocks.

Input:
${text}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      console.error(`Gemini translation failed: ${response.status} ${response.statusText}`);
      return JSON.stringify({ en: text, id: text });
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return JSON.stringify({ en: text, id: text });
    }

    // Validate that it is correct JSON
    const parsed = JSON.parse(rawText.trim());
    if (parsed.en && parsed.id) {
      return JSON.stringify(parsed);
    }
    return JSON.stringify({ en: text, id: text });
  } catch (err: any) {
    console.error("Error during auto-translation:", err.message);
    return JSON.stringify({ en: text, id: text });
  }
}

export function resolveTranslation(text: string | null | undefined, lang: string): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed[lang] || parsed["en"] || text;
    } catch (_) {
      // Fall through
    }
  }
  return text;
}
