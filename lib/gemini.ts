/**
 * Google Gemini Flash API Integration Client - Ultra Fast Real-Time Edition
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const FAST_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
];

export interface GeminiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function generateGeminiContent(
  messages: GeminiMessage[],
  systemInstruction?: string,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const preferredModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const modelsToTry = [
    preferredModel,
    ...FAST_MODELS.filter((m) => m !== preferredModel),
  ];

  // Format contents for Gemini API (user / model)
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.6,
      maxOutputTokens: options.maxTokens ?? 1024,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout per model

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } else {
        const errorText = await response.text();
        console.warn(`Gemini [${model}] status ${response.status}: ${errorText.slice(0, 100)}`);
        lastError = new Error(`Gemini ${model} returned ${response.status}`);
      }
    } catch (err: any) {
      console.warn(`Gemini [${model}] failed (${err.message}), trying next fast model...`);
      lastError = err;
    }
  }

  throw lastError || new Error("All fast Gemini models failed.");
}
