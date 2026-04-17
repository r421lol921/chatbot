export const DEFAULT_CHAT_MODEL = "lio-1";

export const titleModel = {
  id: "lio-1",
  name: "Lio 1.0",
  provider: "lio",
  description: "Lio 1.0 by PeytOtoria",
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  gatewayOrder?: string[];
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
  locked?: boolean;
  requiresPlus?: boolean;
  /** If true, this model runs entirely on-device via WebLLM */
  webllmOnly?: boolean;
  /** The WebLLM model ID to use when running on-device */
  webllmModelId?: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "lio-1",
    name: "Lio 1.0",
    provider: "lio",
    description: "Lio 1.0 by PeytOtoria — runs entirely on your device via WebLLM",
    locked: false,
    webllmOnly: true,
    webllmModelId: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k",
  },
];

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  return {
    "lio-1": { tools: false, vision: false, reasoning: false },
  };
}

/**
 * Returns true for models that support a "Run on device" local inference mode.
 * Lio 1.0 always runs on-device via WebLLM.
 */
export function supportsLocalMode(modelId: string): boolean {
  return modelId === "lio-1";
}

export const isDemo = process.env.IS_DEMO === "1";

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);

// PeytO Plus subscription info
export const PEYTO_PLUS_INFO = {
  name: "PeytO Plus",
  price: "$5.00",
  paymentMethod: "CashApp",
  cashAppTag: "$itslucidpp",
  benefits: [
    "Faster response times",
    "Priority support",
    "More soon!",
  ],
  isOneTime: true,
};
