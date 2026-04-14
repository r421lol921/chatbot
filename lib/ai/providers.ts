import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

// Z.ai / Together.ai API configuration
const Z_AI_API_KEY =
  process.env.Z_AI_API_KEY ||
  "7f9efab132334204a7a71954b0c8ecf8.OJ71uTZuAn7GgSKK";
const Z_AI_BASE_URL =
  process.env.Z_AI_API_URL || "https://api.together.xyz/v1";

// Free model: meta-llama/llama-3.3-70b-instruct (completely free)
const Z_FREE_MODEL = "meta-llama/llama-3.3-70b-instruct";

const togetherProvider = createOpenAI({
  apiKey: Z_AI_API_KEY,
  baseURL: Z_AI_BASE_URL,
});

function createZAIModel(_modelId: string): LanguageModel {
  return togetherProvider(Z_FREE_MODEL);
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
