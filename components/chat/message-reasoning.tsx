"use client";

import { useEffect, useRef, useState } from "react";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";

type MessageReasoningProps = {
  isLoading: boolean;
  reasoning: string;
};

// Minimum ms the "Thinking…" animation shows before collapsing to "Thought for X"
const MIN_THINKING_MS = 1500;

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [hasBeenStreaming, setHasBeenStreaming] = useState(isLoading);
  const startTimeRef = useRef<number | null>(isLoading ? Date.now() : null);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  // Controls the synthetic isStreaming state so we can hold it open for MIN_THINKING_MS
  const [syntheticStreaming, setSyntheticStreaming] = useState(isLoading);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      setHasBeenStreaming(true);
      setSyntheticStreaming(true);
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
    } else {
      // Compute how long we've been thinking
      const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      const remaining = Math.max(0, MIN_THINKING_MS - elapsed);

      // Clear any previous timer
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setSyntheticStreaming(false);
        if (startTimeRef.current !== null && !reasoning) {
          setDuration(Math.max(1, Math.ceil(elapsed / 1000)));
          startTimeRef.current = null;
        }
      }, remaining);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, reasoning]);

  return (
    <Reasoning
      data-testid="message-reasoning"
      defaultOpen={hasBeenStreaming}
      duration={reasoning ? undefined : duration}
      isStreaming={syntheticStreaming}
    >
      <ReasoningTrigger />
      {reasoning && <ReasoningContent>{reasoning}</ReasoningContent>}
    </Reasoning>
  );
}
