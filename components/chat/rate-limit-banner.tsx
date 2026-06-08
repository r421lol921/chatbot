"use client";

import { ClockIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

type RateLimitStatus = {
  limited: boolean;
  secondsRemaining: number;
  intervalHours?: number;
  userType?: string;
  messagesUsed?: number;
  messagesMax?: number;
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function RateLimitBanner() {
  const { data, mutate } = useSWR<RateLimitStatus>(
    "/api/rate-limit",
    fetcher,
    { refreshInterval: 10000 }
  );

  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (data?.limited && data.secondsRemaining > 0) {
      setCountdown(data.secondsRemaining);
    }
  }, [data]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, mutate]);

  if (!data?.limited) return null;

  const intervalHours = data.intervalHours ?? 7;
  const isPlus = data.userType === "plus";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-2">
      <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <ClockIcon className="size-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-foreground leading-tight">
            Message limit reached
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            {data?.messagesMax ?? (isPlus ? 1000 : 25)} messages per {intervalHours}h limit reached &mdash; resets in{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {formatTime(countdown)}
            </span>
          </p>
        </div>
        {!isPlus && (
          <Link
            href="/plans"
            className="shrink-0 text-[11px] font-semibold plus-badge hover:opacity-80 transition-opacity"
          >
            Get Plus
          </Link>
        )}
      </div>
    </div>
  );
}
