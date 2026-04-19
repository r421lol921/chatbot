"use client";

import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface LioLogoProps {
  /** Size in pixels (applied to both width and height). Default: 32 */
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Lio's hand-drawn mascot logo.
 * - White tint on dark theme, black tint on light theme via CSS filter.
 * - Shows "Lio 1.0" tooltip on hover when showTooltip is true.
 */
export function LioLogo({ size = 32, className = "", showTooltip = true }: LioLogoProps) {
  const img = (
    <Image
      src="/images/lio-icon.png"
      alt="Lio"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={[
        "select-none shrink-0",
        // Invert on dark theme so it goes white; stays dark on light theme
        "dark:invert",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={false}
      priority
    />
  );

  if (!showTooltip) return img;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default inline-flex items-center justify-center">
          {img}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[11px] font-medium">
        Lio 1.0
      </TooltipContent>
    </Tooltip>
  );
}
