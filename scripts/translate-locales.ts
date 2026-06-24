import fs from "fs";
import path from "path";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}

const APPS = [
  {
    name: "tenant",
    enPath: path.resolve(__dirname, "../apps/tenant/src/locales/en.json"),
    idPath: path.resolve(__dirname, "../apps/tenant/src/locales/id.json"),
  },
  {
    name: "management",
    enPath: path.resolve(__dirname, "../apps/management/src/locales/en.json"),
    idPath: path.resolve(__dirname, "../apps/management/src/locales/id.json"),
  },
];

async function translateText(textMap: Record<string, string>): Promise<Record<string, string>> {
  const prompt = `You are a professional software localization tool. Translate the values of the following English JSON object to Indonesian (Bahasa Indonesia). 
Maintain the exact same keys. Return ONLY the translated JSON object as the response.

JSON to translate:
${JSON.stringify(textMap, null, 2)}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
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
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Invalid response structure from Gemini API");
  }

  return JSON.parse(rawText.trim());
}

async function run() {
  for (const app of APPS) {
    console.log(`Processing translations for [${app.name}]...`);
    if (!fs.existsSync(app.enPath)) {
      console.warn(`Warning: English locale file not found at ${app.enPath}. Skipping.`);
      continue;
    }

    const enContent = JSON.parse(fs.readFileSync(app.enPath, "utf-8"));
    let idContent: Record<string, string> = {};

    if (fs.existsSync(app.idPath)) {
      try {
        idContent = JSON.parse(fs.readFileSync(app.idPath, "utf-8"));
      } catch (err) {
        console.warn(`Warning: Failed to parse existing Indonesian locale file. Overwriting.`);
      }
    }

    // Identify keys in en.json that are missing in id.json
    const missingKeys: Record<string, string> = {};
    for (const key in enContent) {
      if (!idContent[key]) {
        missingKeys[key] = enContent[key];
      }
    }

    const missingCount = Object.keys(missingKeys).length;
    if (missingCount === 0) {
      console.log(`✓ [${app.name}] Indonesian translation is up-to-date.`);
      continue;
    }

    console.log(`Found ${missingCount} missing translation keys in [${app.name}]. Translating via Gemini...`);
    try {
      const translated = await translateText(missingKeys);
      
      // Merge translations maintaining original order of en.json keys
      const mergedContent: Record<string, string> = {};
      for (const key in enContent) {
        mergedContent[key] = idContent[key] || translated[key] || enContent[key];
      }

      fs.writeFileSync(app.idPath, JSON.stringify(mergedContent, null, 2) + "\n", "utf-8");
      console.log(`✓ [${app.name}] Successfully updated id.json with new translations.`);
    } catch (err: any) {
      console.error(`✗ Error translating [${app.name}]:`, err.message);
    }
  }
}

run();
