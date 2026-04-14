import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

if (!process.env.APIFREELLM_API_KEY) {
  console.warn("[v0] APIFREELLM_API_KEY is not set — AI responses will fail.");
}

const APIFREELLM_BASE_URL = "https://apifreellm.com/api/v1/chat";

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, titleModel } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": titleModel,
        },
      });
    })()
  : null;

// ApiFreeLLM doesn't follow OpenAI format, so we create a custom fetch wrapper
async function callApiFreeLLM(message: string): Promise<string> {
  const response = await fetch(APIFREELLM_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.APIFREELLM_API_KEY ?? ""}`,
    },
    body: JSON.stringify({
      message,
      model: "apifreellm",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ApiFreeLLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.response ?? "";
}

// Create a wrapper that converts ApiFreeLLM to AI SDK compatible format
export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("chat-model");
  }

  // Return a custom model wrapper for ApiFreeLLM
  return {
    modelId,
    provider: "apifreellm",
    specificationVersion: "v1" as const,
    defaultObjectGenerationMode: "json" as const,
    supportsImageUrls: false,
    supportsStructuredOutputs: false,
    
    async doGenerate(options: {
      prompt: Array<{ role: string; content: string | Array<{ type: string; text?: string }> }>;
      mode?: { type: string };
    }) {
      // Extract the last user message
      const lastMessage = options.prompt
        .filter((m) => m.role === "user")
        .pop();

      let messageText = "";
      if (lastMessage) {
        if (typeof lastMessage.content === "string") {
          messageText = lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
          messageText = lastMessage.content
            .filter((part) => part.type === "text" && part.text)
            .map((part) => part.text)
            .join("\n");
        }
      }

      // Include system message context
      const systemMessage = options.prompt.find((m) => m.role === "system");
      if (systemMessage) {
        const systemText =
          typeof systemMessage.content === "string"
            ? systemMessage.content
            : Array.isArray(systemMessage.content)
              ? systemMessage.content
                  .filter((part) => part.type === "text" && part.text)
                  .map((part) => part.text)
                  .join("\n")
              : "";
        messageText = `${systemText}\n\nUser: ${messageText}`;
      }

      const response = await callApiFreeLLM(messageText);

      return {
        text: response,
        finishReason: "stop" as const,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
        },
        rawCall: {
          rawPrompt: messageText,
          rawSettings: {},
        },
      };
    },

    async doStream(options: {
      prompt: Array<{ role: string; content: string | Array<{ type: string; text?: string }> }>;
      mode?: { type: string };
    }) {
      // ApiFreeLLM doesn't support streaming, so we simulate it
      const result = await this.doGenerate(options);

      return {
        stream: new ReadableStream({
          start(controller) {
            // Send the response as a single chunk
            controller.enqueue({
              type: "text-delta",
              textDelta: result.text,
            });
            controller.enqueue({
              type: "finish",
              finishReason: "stop",
              usage: result.usage,
            });
            controller.close();
          },
        }),
        rawCall: result.rawCall,
      };
    },
  };
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return getLanguageModel("lio-1");
}
