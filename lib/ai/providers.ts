import { createOpenAI } from "@ai-sdk/openai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

if (!process.env.OPENROUTER_API_KEY) {
  console.warn("[v0] OPENROUTER_API_KEY is not set — AI responses will fail.");
}

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000",
    "X-Title": "PeytOtoria",
  },
});

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

const MODEL_MAP: Record<string, string> = {
  "lio-1": "openai/gpt-oss-120b:free",
  "lio-2": "qwen/qwen3-next-80b-a3b-instruct:free",
};

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("chat-model");
  }

  const openRouterModel = MODEL_MAP[modelId] ?? MODEL_MAP["lio-1"];
  return openrouter(openRouterModel);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return openrouter("openai/gpt-oss-120b:free");
}
