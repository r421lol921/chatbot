import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

// Groq API configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groqProvider = GROQ_API_KEY ? createGroq({ apiKey: GROQ_API_KEY }) : null;

// Vercel AI Gateway (zero-config when AI_GATEWAY_API_KEY is set)
const gatewayProvider = createOpenAI({
  baseURL: "https://ai-gateway.vercel.sh/v1",
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
});

// Fallback to Together.ai if neither Groq nor AI Gateway is configured
const togetherProvider = createOpenAI({
  apiKey: process.env.Z_AI_API_KEY ?? "",
  baseURL: process.env.Z_AI_API_URL ?? "https://api.together.xyz/v1",
});

function getDefaultProvider() {
  if (process.env.AI_GATEWAY_API_KEY) return gatewayProvider;
  if (process.env.Z_AI_API_KEY) return togetherProvider;
  return gatewayProvider;
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

  // Use Groq if configured
  if (groqProvider) {
    return groqProvider("llama-3.1-8b-instant");
  }

  // Use AI Gateway or Together.ai fallback
  return getDefaultProvider()("gpt-4o-mini");
}

export function getTitleModel(): LanguageModel {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("title-model");
  }

  // Use Groq if configured
  if (groqProvider) {
    return groqProvider("llama-3.1-8b-instant");
  }

  // Use AI Gateway or Together.ai fallback
  return getDefaultProvider()("gpt-4o-mini");
}
