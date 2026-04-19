"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, CopyIcon, CheckIcon, ClockIcon, ShieldIcon } from "lucide-react";

type Props = {
  value: string;
  kind: "username" | "password";
  expiryLabel: string;
  expiryHours: number;
};

export function GenerateArtifact({ value, kind, expiryLabel, expiryHours }: Props) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Compute time-left countdown based on a fixed start time stored in state
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    const expiresAt = startTime + expiryHours * 60 * 60 * 1000;
    const update = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s`);
      else setTimeLeft(`${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime, expiryHours]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard denied */
    }
  };

  const handleDownload = () => {
    const blob = new Blob(
      [`${kind === "username" ? "Username" : "Password"}: ${value}\nAvailable for: ${expiryLabel}\nGenerated at: ${new Date(startTime).toLocaleString()}`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lio-generated-${kind}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isPassword = kind === "password";

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-sm max-w-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/30 px-3.5 py-2.5">
        <ShieldIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Generated {kind === "username" ? "Username" : "Password"}
        </span>
      </div>

      {/* Value */}
      <div className="px-3.5 py-3">
        <div
          className={`flex items-center justify-between rounded-lg border border-border/40 bg-background/60 px-3 py-2.5 gap-2 ${isPassword ? "font-mono" : ""}`}
        >
          <span
            className={`flex-1 text-sm font-medium tracking-tight select-all ${isPassword ? "tracking-wider" : ""}`}
          >
            {value}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Copy to clipboard"
            type="button"
          >
            {copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
          </button>
        </div>

        {/* Availability */}
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ClockIcon className="size-3 shrink-0" />
          <span>Available for <span className="font-medium text-foreground/70">{expiryLabel}</span></span>
          <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground/70">
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Footer: Download */}
      <div className="border-t border-border/40 px-3.5 py-2.5">
        <button
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          type="button"
        >
          <DownloadIcon className="size-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}
