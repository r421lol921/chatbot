import type { LanguageModel } from "ai";
import { customProvider, simulateReadableStream } from "ai";
import { isTestEnvironment } from "../constants";

// Z.ai / Together.ai API configuration
const Z_AI_API_KEY = process.env.Z_AI_API_KEY || "7f9efab132334204a7a71954b0c8ecf8.OJ71uTZuAn7GgSKK";
const Z_AI_BASE_URL = process.env.Z_AI_API_URL || "https://api.together.xyz/v1";

// Free model: meta-llama/llama-3.3-70b-instruct (completely free)
const Z_FREE_MODEL = "meta-llama/llama-3.3-70b-instruct";

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
          temperature: 0.7,
          top_p: 0.9,
          top_k: 50,
          repetition_penalty: 1.0,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`AI API error ${res.status}: ${text}`);
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
          temperature: 0.7,
          top_p: 0.9,
          top_k: 50,
          repetition_penalty: 1.0,
          max_tokens: 2048,
        }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(`AI API stream error ${res.status}: ${text}`);
      }

      // Parse SSE stream into AI SDK stream parts
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
      } finally {
        reader.releaseLock();
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
