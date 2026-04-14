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
};

export const chatModels: ChatModel[] = [
  {
    id: "lio-1",
    name: "Lio 1.0",
    provider: "lio",
    description: "Lio 1.0 by PeytOtoria",
  },
];

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  // Lio 1.0 supports tools
  return {
    "lio-1": { tools: true, vision: false, reasoning: false },
  };
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
