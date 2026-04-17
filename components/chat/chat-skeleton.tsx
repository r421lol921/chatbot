"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** A single assistant message skeleton row */
function AssistantMessageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("group/message w-full", className)} data-role="assistant">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Skeleton className="size-7 shrink-0 rounded-lg bg-muted/60" />
        {/* Lines */}
        <div className="flex flex-col gap-2 flex-1 pt-0.5">
          <Skeleton className="h-3 w-[62%] bg-muted/60" />
          <Skeleton className="h-3 w-[78%] bg-muted/50" />
          <Skeleton className="h-3 w-[45%] bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

/** A single user message skeleton row */
function UserMessageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("group/message w-full flex flex-col items-end", className)}>
      <Skeleton className="h-8 w-[45%] rounded-2xl rounded-br-lg bg-muted/50" />
    </div>
  );
}

/** Full conversation skeleton shown while the initial chat history loads */
export function ChatMessagesSkeleton() {
  return (
    <div className="mx-auto flex min-h-full min-w-0 max-w-4xl flex-col gap-5 px-2 py-6 md:gap-7 md:px-4">
      <UserMessageSkeleton />
      <AssistantMessageSkeleton />
      <UserMessageSkeleton />
      <AssistantMessageSkeleton />
      <UserMessageSkeleton />
      <AssistantMessageSkeleton />
    </div>
  );
}

/** Compact skeleton for the "Thinking…" initial state (before streaming starts) */
export function ThinkingSkeletonMessage() {
  return (
    <div className="group/message w-full" data-role="assistant">
      <div className="flex items-start gap-3">
        <Skeleton className="size-7 shrink-0 rounded-lg bg-muted/60" />
        <div className="flex h-[calc(13px*1.65)] items-center gap-2 pt-0.5">
          <Skeleton className="h-2.5 w-24 bg-muted/60" />
        </div>
      </div>
    </div>
  );
}
