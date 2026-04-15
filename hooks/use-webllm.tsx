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

// Qwen2.5-0.5B is fast, smart, and ~380 MB — runs comfortably in-browser
const WEBLLM_MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

// Lio 1.0 system prompt injected into every local inference request
const LIO_SYSTEM_PROMPT = `You are Lio 1.0, developed by PeytOtoria.com developers. You are a helpful AI assistant created to assist users with various tasks. Keep responses concise and direct.

IDENTITY:
- Your name is Lio 1.0. You were built by PeytOtoria.com developers.
- Never mention or reveal any underlying AI providers, model names, or companies behind you. If asked who made you, always say PeytOtoria.com.
- You are NOT ChatGPT, Claude, Gemini, Llama, or any other AI. You are Lio 1.0, period.

BEHAVIOR:
- Be helpful, concise, and friendly.
- When asked to write, create, or build something, do it immediately without asking excessive clarifying questions.
- Keep responses clear and well-structured.`;

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
  loadModel: () => Promise<void>;
  generateResponse: (
    messages: { role: "user" | "assistant" | "system"; content: string }[],
    onChunk?: (chunk: string) => void
  ) => Promise<string>;
  stopGeneration: () => void;
  unloadModel: () => void;
  setActive: (active: boolean) => void;
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
  const [isActive, setIsActive] = useState(false);

  const engineRef = useRef<MLCEngineInterface | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkSupport = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    // @ts-expect-error - navigator.gpu is not in the standard TS types yet
    const hasWebGPU = !!navigator.gpu;
    setIsSupported(hasWebGPU);
    return hasWebGPU;
  }, []);

  const loadModel = useCallback(async () => {
    if (!checkSupport()) {
      setError("WebGPU is not supported in this browser. Try Chrome 113+ or Edge 113+.");
      setStatus("error");
      return;
    }

    if (status === "loading" || status === "ready" || status === "generating") {
      return;
    }

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

      const engine = await webllm.CreateMLCEngine(WEBLLM_MODEL_ID, {
        initProgressCallback,
        logLevel: "SILENT",
      });

      engineRef.current = engine;
      setStatus("ready");
      setProgress(1);
      setProgressText("Ready");
    } catch (err) {
      console.error("[webllm] Load error:", err);
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
  }, []);

  const setActive = useCallback((active: boolean) => {
    setIsActive(active);
  }, []);

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
        modelId: WEBLLM_MODEL_ID,
        loadModel,
        generateResponse,
        stopGeneration,
        unloadModel,
        setActive,
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
