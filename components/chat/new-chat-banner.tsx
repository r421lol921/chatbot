"use client";

import { PlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type NewChatBannerProps = {
  messageCount: number;
  threshold?: number;
};

export function NewChatBanner({ messageCount, threshold = 5 }: NewChatBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || messageCount < threshold) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-2 pb-1 md:px-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <PlusIcon className="size-3.5 text-muted-foreground" />
        </div>
        <p className="flex-1 text-[12px] text-muted-foreground leading-tight">
          This chat is getting long.{" "}
          <Link
            href="/"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Start a new chat
          </Link>{" "}
          for better results.
        </p>
        <button
          aria-label="Dismiss"
          className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          onClick={() => setDismissed(true)}
          type="button"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
