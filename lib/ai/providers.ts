import type { LanguageModel } from "ai";
import { customProvider, simulateReadableStream } from "ai";
import { isTestEnvironment } from "../constants";

if (!process.env.APIFREELLM_API_KEY) {
  console.warn("[lio] APIFREELLM_API_KEY is not set — AI responses will fail.");
}

// ─── ApiFreeLLM free-tier custom language model ──────────────────────────────
// The free tier uses POST /api/v1/chat with a plain `message` field.
// We avoid importing from @ai-sdk/provider directly to prevent the dual-version
// type conflict (3.0.3 vs 3.0.8 in pnpm). Using `LanguageModel` from "ai" and
// casting internally resolves cleanly through the single ai-package re-export.

function createApiFreeLLMModel(): LanguageModel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model: any = {
    specificationVersion: "v2" as const,
    provider: "apifreellm",
    modelId: "apifreellm-free",
    supportedUrls: {},

    async doGenerate(options: any) {
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

    async doStream(options: any) {
      // Free tier has no streaming — fetch full then simulate stream in chunks
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
      const chunkSize = 6;
      const chunks: any[] = [];

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
        }),
      };
    },
  };

  return model as LanguageModel;
}

// Flatten AI SDK prompt messages into a single string for the simple free API
function buildMessage(options: {
  system?: string;
  prompt: Array<{
    role: string;
    content: Array<{ type: string; text?: string }> | string;
  }>;
}): string {
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
          (p): p is { type: "text"; text: string } =>
            p.type === "text" && typeof p.text === "string",
        )
        .map((p) => p.text)
        .join(" ");
    } else if (typeof msg.content === "string") {
      text = msg.content;
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

export function getLanguageModel(_modelId: string): LanguageModel {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("chat-model");
  }
  return createApiFreeLLMModel();
}

export function getTitleModel(): LanguageModel {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("title-model");
  }
  return createApiFreeLLMModel();
}
