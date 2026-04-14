import type { LanguageModel } from "ai";
import { customProvider, simulateReadableStream } from "ai";
import { isTestEnvironment } from "../constants";

// Z.ai API — uses OpenAI-compatible endpoint
// Free model: meta-llama/llama-3.3-70b-instruct:free (completely free on Z.ai)
const Z_AI_BASE_URL = "https://api.zai.com/v1";
const Z_AI_API_KEY = "7f9efab132334204a7a71954b0c8ecf8.OJ71uTZuAn7GgSKK";

// Lio 1.0 uses llama-3.3-70b (free)
// Lio 2.1 uses llama-3.3-70b as well, but with the smarter system prompt
const Z_FREE_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

function createZAIModel(modelId: string): LanguageModel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model: any = {
    specificationVersion: "v2" as const,
    provider: "z-ai",
    modelId,
    supportedUrls: {},

    async doGenerate(options: any) {
      const messages = buildMessages(options);

      const res = await fetch(`${Z_AI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Z_AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: Z_FREE_MODEL,
          messages,
          stream: false,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Z.ai error ${res.status}: ${text}`);
      }

      const json = (await res.json()) as any;
      const text = json.choices?.[0]?.message?.content ?? "";

      return {
        content: [{ type: "text" as const, text }],
        finishReason: (json.choices?.[0]?.finish_reason ?? "stop") as any,
        usage: {
          inputTokens: json.usage?.prompt_tokens ?? 0,
          outputTokens: json.usage?.completion_tokens ?? 0,
        },
        warnings: [],
      };
    },

    async doStream(options: any) {
      const messages = buildMessages(options);

      const res = await fetch(`${Z_AI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Z_AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: Z_FREE_MODEL,
          messages,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(`Z.ai stream error ${res.status}: ${text}`);
      }

      // Parse SSE stream from Z.ai into AI SDK stream parts
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const chunks: any[] = [];
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(trimmed.slice(6)) as any;
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                chunks.push({ type: "text-delta" as const, textDelta: delta });
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } catch {
        // stream ended
      }

      chunks.push({
        type: "finish" as const,
        finishReason: "stop" as const,
        usage: { inputTokens: 0, outputTokens: 0 },
      });

      return {
        stream: simulateReadableStream({
          chunks,
          initialDelayInMs: 0,
          chunkDelayInMs: 0,
        }),
      };
    },
  };

  return model as LanguageModel;
}

// Convert AI SDK prompt format to OpenAI messages array
function buildMessages(options: {
  system?: string;
  prompt: Array<{
    role: string;
    content: Array<{ type: string; text?: string }> | string;
  }>;
}): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [];

  if (options.system) {
    messages.push({ role: "system", content: options.system });
  }

  for (const msg of options.prompt) {
    let text = "";
    if (Array.isArray(msg.content)) {
      text = msg.content
        .filter(
          (p): p is { type: "text"; text: string } =>
            p.type === "text" && typeof p.text === "string"
        )
        .map((p) => p.text)
        .join(" ");
    } else if (typeof msg.content === "string") {
      text = msg.content;
    }

    if (text.trim()) {
      const role =
        msg.role === "user"
          ? "user"
          : msg.role === "assistant"
            ? "assistant"
            : "system";
      messages.push({ role, content: text });
    }
  }

  return messages;
}

// Mock provider for test environment
const mockProvider = isTestEnvironment
  ? (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { chatModel, titleModel } = require("./models.mock");
        return customProvider({
          languageModels: {
            "chat-model": chatModel,
            "title-model": titleModel,
          },
        });
      } catch {
        return null;
      }
    })()
  : null;

export function getLanguageModel(modelId: string): LanguageModel {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("chat-model");
  }
  return createZAIModel(modelId);
}

export function getTitleModel(): LanguageModel {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("title-model");
  }
  return createZAIModel("title");
}
