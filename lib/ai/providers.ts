import { customProvider, simulateReadableStream } from "ai";
import { isTestEnvironment } from "../constants";

if (!process.env.APIFREELLM_API_KEY) {
  console.warn("[lio] APIFREELLM_API_KEY is not set — AI responses will fail.");
}

// ─── ApiFreeLLM free-tier custom language model ──────────────────────────────
// The free tier does NOT support the OpenAI-compatible endpoint — only a simple
// POST /api/v1/chat with a `message` field and a plain text `response` field.

function createApiFreeLLMModel(systemPromptPrefix?: string) {
  return {
    specificationVersion: "v1" as const,
    provider: "apifreellm",
    modelId: "apifreellm",
    defaultObjectGenerationMode: undefined,

    async doGenerate(options: {
      prompt: Array<{ role: string; content: Array<{ type: string; text?: string }> | string }>;
      system?: string;
    }) {
      const messages = options.prompt as Array<{
        role: string;
        content: Array<{ type: string; text?: string }> | string;
      }>;

      const fullMessage = buildMessage(messages, options.system ?? systemPromptPrefix);

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
        text: json.response,
        finishReason: "stop" as const,
        usage: { promptTokens: 0, completionTokens: 0 },
        rawCall: { rawPrompt: fullMessage, rawSettings: {} },
      };
    },

    async doStream(options: {
      prompt: Array<{ role: string; content: Array<{ type: string; text?: string }> | string }>;
      system?: string;
    }) {
      // Free tier has no streaming endpoint — simulate streaming from the full response
      const messages = options.prompt as Array<{
        role: string;
        content: Array<{ type: string; text?: string }> | string;
      }>;

      const fullMessage = buildMessage(messages, options.system ?? systemPromptPrefix);

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

      // Chunk the text into ~4-char pieces to simulate streaming
      const chunkSize = 4;
      const chunks: string[] = [];
      for (let i = 0; i < responseText.length; i += chunkSize) {
        chunks.push(responseText.slice(i, i + chunkSize));
      }

      return {
        stream: simulateReadableStream({
          chunks: [
            ...chunks.map((chunk) => ({
              type: "text-delta" as const,
              textDelta: chunk,
            })),
            {
              type: "finish" as const,
              finishReason: "stop" as const,
              usage: { promptTokens: 0, completionTokens: 0 },
            },
          ],
          initialDelayInMs: 0,
          chunkDelayInMs: 10,
        }),
        rawCall: { rawPrompt: fullMessage, rawSettings: {} },
      };
    },
  };
}

// Flatten an AI SDK prompt into a single message string for the simple API
function buildMessage(
  messages: Array<{ role: string; content: Array<{ type: string; text?: string }> | string }>,
  systemPrompt?: string
): string {
  const parts: string[] = [];

  if (systemPrompt) {
    parts.push(`[System]: ${systemPrompt}`);
  }

  for (const msg of messages) {
    const role = msg.role === "user" ? "User" : msg.role === "assistant" ? "Assistant" : msg.role;
    let text = "";
    if (typeof msg.content === "string") {
      text = msg.content;
    } else if (Array.isArray(msg.content)) {
      text = msg.content
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text ?? "")
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
