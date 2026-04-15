"use client";

import { useWebLLM } from "@/hooks/use-webllm";
import { isLocalModel } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { Cpu, Loader2, AlertCircle, X } from "lucide-react";
import { useState } from "react";

export function WebLLMBanner({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
  className?: string;
}) {
  const { status, progress, progressText, error, isSupported, loadModel } = useWebLLM();
  const [dismissed, setDismissed] = useState(false);
  
  const isLocal = isLocalModel(selectedModelId);
  
  // Don't show if not local model selected
  if (!isLocal) return null;
  
  // Don't show if dismissed
  if (dismissed) return null;
  
  // Don't show if already ready
  if (status === "ready" || status === "generating") return null;
  
  // Show not supported warning
  if (!isSupported) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 text-destructive" />
          <span className="text-sm text-destructive">
            WebGPU is not supported in this browser. Try Chrome 113+ or Edge 113+.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-destructive/60 hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }
  
  // Show loading state
  if (status === "loading") {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 rounded-lg border border-border/50 bg-card/80 px-4 py-3",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading SmolLM Local...</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground truncate">{progressText}</p>
      </div>
    );
  }
  
  // Show error state
  if (status === "error") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 text-destructive" />
          <span className="text-sm text-destructive">{error || "Failed to load model"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadModel}
            className="text-xs text-destructive underline hover:no-underline"
          >
            Retry
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-destructive/60 hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }
  
  // Show idle state (needs loading)
  if (status === "idle") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-blue-500" />
          <span className="text-sm">
            <span className="font-medium">SmolLM Local</span> runs entirely in your browser.
          </span>
        </div>
        <button
          onClick={loadModel}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
        >
          Load Model (~200MB)
        </button>
      </div>
    );
  }
  
  return null;
}
