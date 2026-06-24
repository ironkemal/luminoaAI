const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL_TIMEOUT_MS = 12_000;

// Non-reasoning instruct models only — reasoning models return empty streaming content
const FREE_MODELS = [
  process.env.OPENROUTER_MODEL || "nvidia/nemotron-nano-12b-v2-vl:free",
  "google/gemma-4-31b-it:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  options: { temperature?: number; maxTokens?: number; stream?: boolean }
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lumino-ai.app",
        "X-Title": "Lumino AI",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.8,
        max_tokens: options.maxTokens ?? 512,
        stream: options.stream ?? false,
      }),
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

const RETRYABLE = new Set([429, 502, 503]);

export async function chat(
  messages: OpenRouterMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  let lastError = "";

  for (const model of FREE_MODELS) {
    try {
      const response = await callOpenRouter(model, messages, options);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          lastError = `${model} returned empty content`;
          console.warn(lastError);
          continue;
        }
        return content as string;
      }

      const errBody = await response.text();
      lastError = `${model} → HTTP ${response.status}: ${errBody.slice(0, 150)}`;
      if (!RETRYABLE.has(response.status)) break;
      console.warn(`OpenRouter: ${model} rate-limited, trying next…`);

    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      lastError = `${model} → ${isAbort ? "timeout (20s)" : String(err)}`;
      console.warn(`OpenRouter: ${lastError}`);
    }
  }

  throw new Error(`All models failed. Last: ${lastError}`);
}

export async function chatStream(
  messages: OpenRouterMessage[],
  onChunk: (text: string) => void,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<void> {
  let lastError = "";

  for (const model of FREE_MODELS) {
    try {
      const response = await callOpenRouter(model, messages, { ...options, stream: true });

      if (!response.ok) {
        const errBody = await response.text();
        lastError = `${model} → HTTP ${response.status}: ${errBody.slice(0, 150)}`;
        if (!RETRYABLE.has(response.status)) break;
        console.warn(`OpenRouter stream: ${model} rate-limited, trying next…`);
        continue;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let gotContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") return;
          try {
            const parsed = JSON.parse(raw);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) { onChunk(text); gotContent = true; }
          } catch { /* partial chunk */ }
        }
      }

      if (!gotContent) {
        lastError = `${model} stream returned no content`;
        console.warn(lastError);
        continue;
      }
      return;

    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      lastError = `${model} → ${isAbort ? "timeout (20s)" : String(err)}`;
      console.warn(`OpenRouter stream: ${lastError}`);
    }
  }

  throw new Error(`All stream models failed. Last: ${lastError}`);
}
