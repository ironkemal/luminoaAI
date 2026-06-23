const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chat(
  messages: OpenRouterMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://lumino-ai.app",
      "X-Title": "Lumino AI",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 512,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}

export async function chatStream(
  messages: OpenRouterMessage[],
  onChunk: (text: string) => void,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<void> {
  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://lumino-ai.app",
      "X-Title": "Lumino AI",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 512,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error: ${response.status} - ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) onChunk(text);
      } catch {}
    }
  }
}
