import { createOpenAI } from "@ai-sdk/openai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

if (!process.env.APIFREELLM_API_KEY) {
  console.warn("[v0] APIFREELLM_API_KEY is not set — AI responses will fail.");
}

// ApiFreeLLM exposes an OpenAI-compatible endpoint at /v1
const apiFreeLLM = createOpenAI({
  baseURL: "https://apifreellm.com/v1",
  apiKey: process.env.APIFREELLM_API_KEY ?? "",
  name: "apifreellm",
});

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

// Maps our internal model IDs to ApiFreeLLM model IDs
function resolveModelId(modelId: string): string {
  const map: Record<string, string> = {
    "lio-1": "gpt-4o-mini",
    "lio-2": "gpt-4o",
  };
  return map[modelId] ?? "gpt-4o-mini";
}

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("chat-model");
  }
  return apiFreeLLM(resolveModelId(modelId));
}

export function getTitleModel() {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("title-model");
  }
  return apiFreeLLM("gpt-4o-mini");
}
