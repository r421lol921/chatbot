"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";

// SmolLM2-360M is a tiny but capable model that runs fast in the browser
// It's good for simple tasks and has a small download size (~200MB)
const WEBLLM_MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1-MLC";

type WebLLMStatus = "idle" | "loading" | "ready" | "generating" | "error";

type WebLLMContextValue = {
  status: WebLLMStatus;
  progress: number;
  progressText: string;
  error: string | null;
  isSupported: boolean;
  loadModel: () => Promise<void>;
  generateResponse: (
    messages: { role: "user" | "assistant" | "system"; content: string }[],
    onChunk?: (chunk: string) => void
  ) => Promise<string>;
  stopGeneration: () => void;
  unloadModel: () => void;
};

const WebLLMContext = createContext<WebLLMContextValue | null>(null);

export function WebLLMProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WebLLMStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const engineRef = useRef<MLCEngineInterface | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check WebGPU support on mount
  const checkSupport = useCallback(() => {
    if (typeof window === "undefined") return false;
    // @ts-expect-error - navigator.gpu is not in the standard types
    const hasWebGPU = !!navigator.gpu;
    setIsSupported(hasWebGPU);
    return hasWebGPU;
  }, []);

  const loadModel = useCallback(async () => {
    if (!checkSupport()) {
      setError("WebGPU is not supported in this browser. Try Chrome or Edge.");
      setStatus("error");
      return;
    }

    if (status === "loading" || status === "ready") {
      return;
    }

    setStatus("loading");
    setProgress(0);
    setProgressText("Initializing WebLLM...");
    setError(null);

    try {
      // Dynamic import to avoid SSR issues
      const webllm = await import("@mlc-ai/web-llm");

      const initProgressCallback = (report: InitProgressReport) => {
        setProgress(report.progress);
        setProgressText(report.text);
      };

      const engine = await webllm.CreateMLCEngine(WEBLLM_MODEL_ID, {
        initProgressCallback,
        logLevel: "SILENT",
      });

      engineRef.current = engine;
      setStatus("ready");
      setProgressText("Model loaded!");
    } catch (err) {
      console.error("[v0] WebLLM load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load model");
      setStatus("error");
    }
  }, [status, checkSupport]);

  const generateResponse = useCallback(
    async (
      messages: { role: "user" | "assistant" | "system"; content: string }[],
      onChunk?: (chunk: string) => void
    ): Promise<string> => {
      if (!engineRef.current || status !== "ready") {
        throw new Error("Model not loaded");
      }

      setStatus("generating");
      abortControllerRef.current = new AbortController();

      try {
        let fullResponse = "";

        const stream = await engineRef.current.chat.completions.create({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
          temperature: 0.7,
          max_tokens: 1024,
        });

        for await (const chunk of stream) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          const delta = chunk.choices[0]?.delta?.content || "";
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
        console.error("[v0] WebLLM generation error:", err);
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
    if (engineRef.current) {
      engineRef.current = null;
      setStatus("idle");
      setProgress(0);
      setProgressText("");
    }
  }, []);

  return (
    <WebLLMContext.Provider
      value={{
        status,
        progress,
        progressText,
        error,
        isSupported,
        loadModel,
        generateResponse,
        stopGeneration,
        unloadModel,
      }}
    >
      {children}
    </WebLLMContext.Provider>
  );
}

export function useWebLLM() {
  const context = useContext(WebLLMContext);
  if (!context) {
    throw new Error("useWebLLM must be used within WebLLMProvider");
  }
  return context;
}
