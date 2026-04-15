"use client";

import { useWebLLM } from "@/hooks/use-webllm";
import { cn } from "@/lib/utils";
import { X, Cpu, HardDrive, Zap, Shield, ChevronRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called when the user finishes installing and wants to switch to local mode */
  onActivate: () => void;
};

const MODEL_SPECS = [
  {
    icon: HardDrive,
    label: "Model size",
    value: "~1.9 GB",
  },
  {
    icon: Cpu,
    label: "Requires",
    value: "WebGPU",
  },
  {
    icon: Zap,
    label: "Speed",
    value: "~20 tok/s",
  },
  {
    icon: Shield,
    label: "Privacy",
    value: "100% local",
  },
] as const;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function WebLLMInstallModal({ open, onClose, onActivate }: Props) {
  const webllm = useWebLLM();

  if (!open) return null;

  const isIdle = webllm.status === "idle" || webllm.status === "error";
  const isLoading = webllm.status === "loading";
  const isReady = webllm.status === "ready" || webllm.status === "generating";

  const progressPct = Math.round(webllm.progress * 100);

  const handlePrimaryAction = () => {
    if (isReady) {
      onActivate();
      onClose();
    } else if (isIdle) {
      webllm.loadModel();
    }
  };

  const handleClose = () => {
    if (isLoading) return; // don't close mid-download
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-label="Run Lio on device"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  <Cpu className="size-3" />
                  On-Device AI
                </span>
              </div>
              <h2 className="text-xl font-semibold text-foreground text-balance">
                Run Lio locally
              </h2>
              <p className="mt-1 text-sm text-muted-foreground text-balance">
                Download a compact model that runs entirely in your browser. No
                data ever leaves your device.
              </p>
            </div>
            {!isLoading && (
              <button
                className="ml-4 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                onClick={handleClose}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Spec grid */}
          <div className="grid grid-cols-4 gap-px bg-border/40 mx-6 mt-5 rounded-xl overflow-hidden border border-border/40">
            {MODEL_SPECS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 bg-muted/30 py-3 px-2"
              >
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-[13px] font-semibold text-foreground leading-none">
                  {value}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Model name row */}
          <div className="mx-6 mt-3 flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
            <div>
              <p className="text-[12px] font-medium text-foreground">
                Llama 3.2 · 3B Instruct
              </p>
              <p className="text-[11px] text-muted-foreground">
                INT4 quantised · MLC format
              </p>
            </div>
            <span className="text-[10px] font-semibold bg-foreground/10 text-foreground rounded-full px-2 py-0.5">
              q4f16
            </span>
          </div>

          {/* Progress / status area */}
          <div className="px-6 pt-4 pb-5 space-y-3">
            {isLoading && (
              <div className="space-y-2">
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-300 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Label row */}
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-muted-foreground truncate max-w-[70%]">
                    {webllm.progressText || "Downloading…"}
                  </p>
                  <span className="text-[12px] font-semibold tabular-nums text-foreground shrink-0">
                    {progressPct}%
                  </span>
                </div>

                {/* Bytes if available */}
                {webllm.totalBytes > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(webllm.downloadedBytes)} /{" "}
                    {formatBytes(webllm.totalBytes)}
                  </p>
                )}
              </div>
            )}

            {webllm.error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                <AlertCircle className="size-4 shrink-0 text-destructive mt-px" />
                <p className="text-[12px] text-destructive leading-relaxed">
                  {webllm.error}
                </p>
              </div>
            )}

            {isReady && (
              <div className="flex items-center gap-2 rounded-lg bg-foreground/5 border border-border/40 px-3 py-2.5">
                <CheckCircle2 className="size-4 text-foreground shrink-0" />
                <p className="text-[12px] text-foreground font-medium">
                  Model ready — runs entirely in your browser
                </p>
              </div>
            )}

            {/* Primary action */}
            <button
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
                isLoading
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : isReady
                  ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
                  : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
              )}
              onClick={handlePrimaryAction}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Downloading…
                </>
              ) : isReady ? (
                <>
                  Use Lio on device
                  <ChevronRight className="size-4" />
                </>
              ) : (
                <>
                  Download &amp; run locally
                  <ChevronRight className="size-4" />
                </>
              )}
            </button>

            {/* Footer note */}
            <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
              Requires Chrome 113+ or Edge 113+ with WebGPU enabled.
              {!isLoading && !isReady && (
                <> Downloaded once and cached in your browser.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
