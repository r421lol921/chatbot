import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

// Groq API configuration for llama-3.1-8b-instant
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groqProvider = GROQ_API_KEY ? createGroq({ apiKey: GROQ_API_KEY }) : null;

// Fallback to Together.ai if Groq is not configured
const Z_AI_API_KEY =
  process.env.Z_AI_API_KEY ||
  "7f9efab132334204a7a71954b0c8ecf8.OJ71uTZuAn7GgSKK";
const Z_AI_BASE_URL =
  process.env.Z_AI_API_URL || "https://api.together.xyz/v1";

const togetherProvider = createOpenAI({
  apiKey: Z_AI_API_KEY,
  baseURL: Z_AI_BASE_URL,
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

export function getLanguageModel(modelId: string): LanguageModel {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("chat-model");
  }
  
  // Use Groq for llama-3.1-8b-instant if configured
  if (groqProvider && modelId === "lio-1") {
    return groqProvider("llama-3.1-8b-instant");
  }
  
  // Fallback to Together.ai
  return togetherProvider("meta-llama/llama-3.3-70b-instruct");
}

export function getTitleModel(): LanguageModel {
  if (isTestEnvironment && mockProvider) {
    return mockProvider.languageModel("title-model");
  }
  
  // Use Groq for title generation if available
  if (groqProvider) {
    return groqProvider("llama-3.1-8b-instant");
  }
  
  return togetherProvider("meta-llama/llama-3.3-70b-instruct");
}
