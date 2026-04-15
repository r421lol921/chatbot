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
};

export const chatModels: ChatModel[] = [
  {
    id: "lio-1",
    name: "Lio 1.0",
    provider: "lio",
    description: "Lio 1.0 by PeytOtoria",
    locked: false,
  },
  {
    id: "lio-2",
    name: "Lio 2.1",
    provider: "lio",
    description: "Lio 2.1 by PeytOtoria — faster and smarter",
    locked: true,
    requiresPlus: true,
  },
];

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  return {
    "lio-1": { tools: true, vision: false, reasoning: false },
    "lio-2": { tools: true, vision: true, reasoning: true },
  };
}

/**
 * Returns true for models that support a "Run on device" local inference mode.
 * Currently only Lio 1.0 exposes this option.
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
    "Unlock Lio 2.1 — our most advanced AI model",
    "Faster response times",
    "Enhanced reasoning capabilities",
    "Vision and image understanding",
    "Priority support",
  ],
  isOneTime: true,
};
