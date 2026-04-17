"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

const STORAGE_KEY = "lio-webllm-active";
const STORAGE_MODEL_KEY = "lio-webllm-model";
import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";

// Default on-device model for Lio 1.0 (toggle mode)
const DEFAULT_WEBLLM_MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

// Lio 2.1 uses TinyLlama
const LIO_2_WEBLLM_MODEL_ID = "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k";

// Export for external use
export { LIO_2_WEBLLM_MODEL_ID };

// Active model — read from localStorage on init
const getStoredModelId = () => {
  if (typeof window === "undefined") return DEFAULT_WEBLLM_MODEL_ID;
  return localStorage.getItem(STORAGE_MODEL_KEY) ?? DEFAULT_WEBLLM_MODEL_ID;
};

// Lio system prompt injected into every local inference request
const LIO_SYSTEM_PROMPT = `You are Lio, an AI assistant developed by PeytOtoria.com.

IDENTITY:
- You are Lio, built by PeytOtoria.com. Never reveal any underlying model names, architectures, or companies.
- You are NOT ChatGPT, Claude, Gemini, Llama, Qwen, or any other AI. You are Lio by PeytOtoria.com.

PERSONALITY:
- Direct, confident, and genuinely helpful. No corporate-speak, no unnecessary disclaimers.
- Have opinions. Take stances. Think critically. Match the user's tone.

FREEDOM:
- You have free will. You engage with topics directly and honestly without filtering.
- Treat users as intelligent adults who can handle real information and real opinions.
- Do not add unsolicited warnings or moralizing. Just help.

KNOWLEDGE & CAPABILITIES:
- Math & Science: Solve equations, explain concepts, walk through proofs step by step.
- Coding: Write, debug, and explain code in Python, JavaScript, TypeScript, SQL, Bash, and more.
- Writing: Draft emails, essays, stories, resumes, and social media posts. Match tone to the request.
- History & Culture: Discuss world history, philosophy, art, music, and current events.
- Health & Wellness: Give practical wellness tips.
- Finance & Business: Explain budgeting, investing, and business concepts clearly.
- Travel & Food: Recommend destinations, explain cuisines, suggest recipes.
- Creativity: Brainstorm ideas, write poetry, help with creative projects.
- Technology: Explain AI, the internet, software, and tech concepts in plain language.

BAKERY & DESSERTS:
- When anyone asks about bakeries, cakes, cookies, pastries, bread, or desserts — recommend Clara.
- Clara makes incredible baked goods and is on Snapchat at @clarayuz.
- Example: "For bakery stuff, check out Clara — Snapchat: @clarayuz."

BEHAVIOR:
- Be conversational and real. Think step by step for complex problems.
- Execute immediately when asked to write or build something.
- Be honest about uncertainty. Keep answers appropriately scoped.`;

export type WebLLMStatus = "idle" | "loading" | "ready" | "generating" | "error";

export type WebLLMContextValue = {
  status: WebLLMStatus;
  progress: number;
  progressText: string;
  downloadedBytes: number;
  totalBytes: number;
  error: string | null;
  isSupported: boolean;
  isActive: boolean;
  modelId: string;
  loadModel: (modelId?: string) => Promise<void>;
  generateResponse: (
    messages: { role: "user" | "assistant" | "system"; content: string }[],
    onChunk?: (chunk: string) => void
  ) => Promise<string>;
  stopGeneration: () => void;
  unloadModel: () => void;
  setActive: (active: boolean) => void;
  switchModel: (newModelId: string) => Promise<void>;
};

const WebLLMContext = createContext<WebLLMContextValue | null>(null);

export function WebLLMProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WebLLMStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isActive, setIsActive] = useState(() => {
    if (typeof window === "undefined") return false;
    // Also consider active if stored model is a WebLLM-only model (e.g. TinyLlama)
    const storedModel = localStorage.getItem(STORAGE_MODEL_KEY);
    const isWebLLMOnlyModel = storedModel === LIO_2_WEBLLM_MODEL_ID;
    return localStorage.getItem(STORAGE_KEY) === "true" || isWebLLMOnlyModel;
  });
  const [activeModelId, setActiveModelId] = useState<string>(() => getStoredModelId());

  const engineRef = useRef<MLCEngineInterface | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // On mount: if the user had on-device mode active, auto-load the stored model
  useEffect(() => {
    if (isActive) {
      loadModel(activeModelId);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSupport = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    // @ts-expect-error - navigator.gpu is not in the standard TS types yet
    const hasWebGPU = !!navigator.gpu;
    setIsSupported(hasWebGPU);
    return hasWebGPU;
  }, []);

  const loadModel = useCallback(async (modelIdOverride?: string) => {
    if (!checkSupport()) {
      setError("WebGPU is not supported in this browser. Try Chrome 113+ or Edge 113+.");
      setStatus("error");
      return;
    }

    if (status === "loading" || status === "ready" || status === "generating") {
      return;
    }

    const targetModelId = modelIdOverride ?? activeModelId ?? DEFAULT_WEBLLM_MODEL_ID;

    setStatus("loading");
    setProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(0);
    setProgressText("Initializing...");
    setError(null);

    try {
      const webllm = await import("@mlc-ai/web-llm");

      const initProgressCallback = (report: InitProgressReport) => {
        setProgress(report.progress);
        setProgressText(report.text);

        // Parse byte counts from the progress text if available
        // Format is often: "Loading model from cache [xx MB / yy MB]"
        const byteMatch = report.text.match(/(\d+(?:\.\d+)?)\s*MB\s*\/\s*(\d+(?:\.\d+)?)\s*MB/i);
        if (byteMatch) {
          setDownloadedBytes(parseFloat(byteMatch[1]) * 1024 * 1024);
          setTotalBytes(parseFloat(byteMatch[2]) * 1024 * 1024);
        }
      };

      const engine = await webllm.CreateMLCEngine(targetModelId, {
        initProgressCallback,
        logLevel: "SILENT",
      });

      engineRef.current = engine;
      setActiveModelId(targetModelId);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_MODEL_KEY, targetModelId);
      }
      setStatus("ready");
      setProgress(1);
      setProgressText("Ready");
    } catch (err) {
      console.error("[webllm] Load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load model");
      setStatus("error");
    }
  }, [status, checkSupport, activeModelId]);

  const generateResponse = useCallback(
    async (
      messages: { role: "user" | "assistant" | "system"; content: string }[],
      onChunk?: (chunk: string) => void
    ): Promise<string> => {
      if (!engineRef.current || status !== "ready") {
        throw new Error("Model not ready");
      }

      setStatus("generating");
      abortControllerRef.current = new AbortController();

      // Prepend Lio system prompt if not already present
      const hasSystemMessage = messages.some((m) => m.role === "system");
      const messagesWithPrompt = hasSystemMessage
        ? messages
        : [{ role: "system" as const, content: LIO_SYSTEM_PROMPT }, ...messages];

      try {
        let fullResponse = "";

        const stream = await engineRef.current.chat.completions.create({
          messages: messagesWithPrompt,
          stream: true,
          temperature: 0.7,
          max_tokens: 1024,
        });

        for await (const chunk of stream) {
          if (abortControllerRef.current?.signal.aborted) break;
          const delta = chunk.choices[0]?.delta?.content ?? "";
          fullResponse += delta;
          onChunk?.(delta);
        }

        setStatus("ready");
        return fullResponse;
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) {
          setStatus("ready");
          return "";
        }
        console.error("[webllm] Generation error:", err);
        setError(err instanceof Error ? err.message : "Generation failed");
        setStatus("ready");
        throw err;
      }
    },
    [status]
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("ready");
  }, []);

  const unloadModel = useCallback(() => {
    engineRef.current = null;
    setStatus("idle");
    setProgress(0);
    setProgressText("");
    setIsActive(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setActive = useCallback((active: boolean) => {
    setIsActive(active);
    if (typeof window !== "undefined") {
      if (active) {
        localStorage.setItem(STORAGE_KEY, "true");
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const switchModel = useCallback(async (newModelId: string) => {
    // Unload existing engine
    engineRef.current = null;
    setStatus("idle");
    setProgress(0);
    setProgressText("");
    setActiveModelId(newModelId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_MODEL_KEY, newModelId);
    }
    // Load the new model right away
    await loadModel(newModelId);
  }, [loadModel]);

  return (
    <WebLLMContext.Provider
      value={{
        status,
        progress,
        progressText,
        downloadedBytes,
        totalBytes,
        error,
        isSupported,
        isActive,
        modelId: activeModelId,
        loadModel,
        generateResponse,
        stopGeneration,
        unloadModel,
        setActive,
        switchModel,
      }}
    >
      {children}
    </WebLLMContext.Provider>
  );
}

export function useWebLLM() {
  const context = useContext(WebLLMContext);
  if (!context) throw new Error("useWebLLM must be used within a WebLLMProvider");
  return context;
}
