import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import type { LanguageModelV1, LanguageModelV1StreamPart } from "@ai-sdk/provider";

if (!process.env.APIFREELLM_API_KEY) {
  console.warn("[v0] APIFREELLM_API_KEY is not set — AI responses will fail.");
}

const APIFREELLM_BASE_URL = "https://apifreellm.com/api/v1/chat";

// Call the ApiFreeLLM API with the given prompt text
async function callApiFreeLLM(message: string): Promise<string> {
  const response = await fetch(APIFREELLM_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.APIFREELLM_API_KEY ?? ""}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ApiFreeLLM error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.response ?? "";
}

// Helper: flatten AI SDK prompt messages into a single string
function flattenPrompt(
  prompt: Array<{
    role: string;
    content:
      | string
      | Array<{ type: string; text?: string; [key: string]: unknown }>;
  }>
): string {
  const parts: string[] = [];

  for (const message of prompt) {
    let text = "";
    if (typeof message.content === "string") {
      text = message.content;
    } else if (Array.isArray(message.content)) {
      text = message.content
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string)
        .join("\n");
    }

    if (!text.trim()) continue;

    if (message.role === "system") {
      parts.push(text);
    } else if (message.role === "user") {
      parts.push(`User: ${text}`);
    } else if (message.role === "assistant") {
      parts.push(`Assistant: ${text}`);
    }
  }

  return parts.join("\n\n");
}

// Build a LanguageModelV1-compatible object wrapping the ApiFreeLLM API
function createApiFreeLLMModel(modelId: string): LanguageModelV1 {
  return {
    specificationVersion: "v1",
    provider: "apifreellm",
    modelId,
    defaultObjectGenerationMode: "json",
    supportsImageUrls: false,
    supportsStructuredOutputs: false,

    async doGenerate(options) {
      const message = flattenPrompt(options.prompt as Parameters<typeof flattenPrompt>[0]);
      const text = await callApiFreeLLM(message);

      return {
        text,
        finishReason: "stop",
        usage: { promptTokens: 0, completionTokens: 0 },
        rawCall: { rawPrompt: message, rawSettings: {} },
      };
    },

    async doStream(options) {
      const message = flattenPrompt(options.prompt as Parameters<typeof flattenPrompt>[0]);
      const text = await callApiFreeLLM(message);

      // ApiFreeLLM free tier doesn't stream — simulate it as a single chunk
      const stream = new ReadableStream<LanguageModelV1StreamPart>({
        start(controller) {
          controller.enqueue({ type: "text-delta", textDelta: text });
          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage: { promptTokens: 0, completionTokens: 0 },
          });
          controller.close();
        },
      });

      return {
        stream,
        rawCall: { rawPrompt: message, rawSettings: {} },
      };
    },
  };
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

export function getLanguageModel(modelId: string): LanguageModelV1 {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("chat-model");
  }
  return createApiFreeLLMModel(modelId);
}

export function getTitleModel(): LanguageModelV1 {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("title-model");
  }
  return createApiFreeLLMModel("lio-1");
}
