"use client";

import { Shimmer } from "@/components/ai-elements/shimmer";

export type ActivityType =
  | "writing"
  | "coding"
  | "analyzing"
  | "searching"
  | "mapping"
  | "thinking";

const LABELS: Record<ActivityType, string> = {
  writing: "Writing...",
  coding: "Coding...",
  analyzing: "Analyzing...",
  searching: "Searching...",
  mapping: "Mapping...",
  thinking: "Thinking...",
};

interface ActivityLabelProps {
  type: ActivityType;
  isActive: boolean;
}

export function ActivityLabel({ type, isActive }: ActivityLabelProps) {
  if (!isActive) return null;

  return (
    <div className="flex h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65]">
      <Shimmer className="font-medium" duration={1}>
        {LABELS[type]}
      </Shimmer>
    </div>
  );
}
