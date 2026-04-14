import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2StreamPart,
} from "@ai-sdk/provider";
import { customProvider, simulateReadableStream } from "ai";
import { isTestEnvironment } from "../constants";

if (!process.env.APIFREELLM_API_KEY) {
  console.warn("[lio] APIFREELLM_API_KEY is not set — AI responses will fail.");
}

// ─── ApiFreeLLM free-tier custom language model ──────────────────────────────
// The free tier uses POST /api/v1/chat with a `message` field and returns a
// plain `response` string. No OpenAI-compatible endpoint is available on free.

function createApiFreeLLMModel(): LanguageModelV2 {
  return {
    specificationVersion: "v2" as const,
    provider: "apifreellm",
    modelId: "apifreellm-free",
    supportedUrls: {},

    async doGenerate(options: LanguageModelV2CallOptions) {
      const fullMessage = buildMessage(options);

      const res = await fetch("https://apifreellm.com/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.APIFREELLM_API_KEY ?? ""}`,
        },
        body: JSON.stringify({ message: fullMessage }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`ApiFreeLLM error ${res.status}: ${text}`);
      }

      const json = (await res.json()) as { success: boolean; response: string };
      if (!json.success) {
        throw new Error("ApiFreeLLM returned success:false");
      }

      return {
        content: [{ type: "text" as const, text: json.response }],
        finishReason: "stop" as const,
        usage: { inputTokens: 0, outputTokens: 0 },
        warnings: [],
      };
    },

    async doStream(options: LanguageModelV2CallOptions) {
      // Free tier has no streaming — fetch full response then simulate streaming
      const fullMessage = buildMessage(options);

      const res = await fetch("https://apifreellm.com/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.APIFREELLM_API_KEY ?? ""}`,
        },
        body: JSON.stringify({ message: fullMessage }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`ApiFreeLLM error ${res.status}: ${text}`);
      }

      const json = (await res.json()) as { success: boolean; response: string };
      if (!json.success) {
        throw new Error("ApiFreeLLM returned success:false");
      }

      const responseText = json.response;

      // Chunk into ~6-char pieces to simulate streaming
      const chunkSize = 6;
      const chunks: LanguageModelV2StreamPart[] = [];
      for (let i = 0; i < responseText.length; i += chunkSize) {
        chunks.push({
          type: "text-delta" as const,
          textDelta: responseText.slice(i, i + chunkSize),
        });
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
          chunkDelayInMs: 8,
        }) as ReadableStream<LanguageModelV2StreamPart>,
      };
    },
  };
}

// Flatten AI SDK v2 call options into a single string for the simple API
function buildMessage(options: LanguageModelV2CallOptions): string {
  const parts: string[] = [];

  if (options.system) {
    parts.push(`[System]: ${options.system}`);
  }

  for (const msg of options.prompt) {
    const role =
      msg.role === "user"
        ? "User"
        : msg.role === "assistant"
          ? "Assistant"
          : String(msg.role);

    let text = "";
    if (Array.isArray(msg.content)) {
      text = msg.content
        .filter(
          (p): p is { type: "text"; text: string } => p.type === "text",
        )
        .map((p) => p.text)
        .join(" ");
    }

    if (text.trim()) {
      parts.push(`[${role}]: ${text}`);
    }
  }

  return parts.join("\n\n");
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

export function getLanguageModel(_modelId: string) {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("chat-model");
  }
  return createApiFreeLLMModel();
}

export function getTitleModel() {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("title-model");
  }
  return createApiFreeLLMModel();
}
