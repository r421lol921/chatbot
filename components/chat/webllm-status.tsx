"use client";

import { useWebLLM } from "@/hooks/use-webllm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Cpu, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function WebLLMStatus({ className }: { className?: string }) {
  const { status, progress, progressText, error, isSupported, loadModel, unloadModel } =
    useWebLLM();

  if (!isSupported) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive",
          className
        )}
      >
        <AlertCircle className="size-3.5" />
        <span>WebGPU not supported. Use Chrome or Edge.</span>
      </div>
    );
  }

  if (status === "idle") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={loadModel}
        className={cn(
          "h-8 gap-2 rounded-lg border-border/50 text-[12px] font-medium",
          className
        )}
      >
        <Download className="size-3.5" />
        Load Local AI
      </Button>
    );
  }

  if (status === "loading") {
    return (
      <div
        className={cn(
          "flex flex-col gap-1.5 rounded-lg border border-border/50 bg-card/50 px-3 py-2",
          className
        )}
      >
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span className="truncate max-w-[200px]">{progressText || "Loading..."}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2",
          className
        )}
      >
        <AlertCircle className="size-3.5 text-destructive" />
        <span className="text-[12px] text-destructive truncate max-w-[180px]">
          {error || "Failed to load"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadModel}
          className="h-6 px-2 text-[11px]"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Status is "ready" or "generating"
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-2",
        className
      )}
    >
      {status === "generating" ? (
        <Loader2 className="size-3.5 animate-spin text-primary" />
      ) : (
        <CheckCircle2 className="size-3.5 text-green-500" />
      )}
      <span className="text-[12px] text-muted-foreground">
        {status === "generating" ? "Generating..." : "Local AI Ready"}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={unloadModel}
        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
      >
        Unload
      </Button>
    </div>
  );
}

export function WebLLMIndicator({ className }: { className?: string }) {
  const { status, isSupported } = useWebLLM();

  if (!isSupported || status === "idle") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[11px]",
        status === "ready" && "text-green-500",
        status === "loading" && "text-muted-foreground",
        status === "generating" && "text-primary",
        status === "error" && "text-destructive",
        className
      )}
    >
      <Cpu className="size-3" />
      <span>
        {status === "ready" && "Local"}
        {status === "loading" && "Loading..."}
        {status === "generating" && "Local AI"}
        {status === "error" && "Error"}
      </span>
    </div>
  );
}
