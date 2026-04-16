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

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  // Track whether streaming has started so we keep the block visible
  const [hasBeenStreaming, setHasBeenStreaming] = useState(isLoading);
  // Manually compute duration for synthetic (no-reasoning-parts) messages
  const startTimeRef = useRef<number | null>(isLoading ? Date.now() : null);
  const [duration, setDuration] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isLoading) {
      setHasBeenStreaming(true);
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
    } else if (startTimeRef.current !== null && !reasoning) {
      // Only set duration ourselves when there are no native reasoning parts
      setDuration(Math.max(1, Math.ceil((Date.now() - startTimeRef.current) / 1000)));
      startTimeRef.current = null;
    }
  }, [isLoading, reasoning]);

  return (
    <Reasoning
      data-testid="message-reasoning"
      defaultOpen={hasBeenStreaming}
      duration={reasoning ? undefined : duration}
      isStreaming={isLoading}
    >
      <ReasoningTrigger />
      {reasoning && <ReasoningContent>{reasoning}</ReasoningContent>}
    </Reasoning>
  );
}
