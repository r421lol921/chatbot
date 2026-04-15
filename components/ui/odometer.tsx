"use client";

import { useEffect, useRef, useState } from "react";

interface OdometerProps {
  value: number;
  className?: string;
}

function OdometerDigit({ digit, prevDigit }: { digit: string; prevDigit: string }) {
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const prevRef = useRef(prevDigit);

  useEffect(() => {
    if (digit !== prevRef.current) {
      const prev = parseInt(prevRef.current, 10);
      const curr = parseInt(digit, 10);
      if (!isNaN(prev) && !isNaN(curr)) {
        setDirection(curr > prev ? "up" : "down");
      }
      setAnimating(true);
      const t = setTimeout(() => {
        setAnimating(false);
        prevRef.current = digit;
      }, 400);
      return () => clearTimeout(t);
    }
  }, [digit]);

  const isNonNumeric = isNaN(Number(digit));

  if (isNonNumeric) {
    return (
      <span className="inline-flex h-full items-center justify-center font-mono tabular-nums">
        {digit}
      </span>
    );
  }

  return (
    <span
      className="relative inline-flex h-[1.2em] overflow-hidden align-middle font-mono tabular-nums"
      style={{ minWidth: "0.6em" }}
    >
      {/* Outgoing digit */}
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-[380ms] ease-in-out"
        style={{
          transform: animating
            ? direction === "up"
              ? "translateY(-100%)"
              : "translateY(100%)"
            : "translateY(0%)",
          opacity: animating ? 0 : 1,
        }}
      >
        {prevRef.current}
      </span>
      {/* Incoming digit */}
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-[380ms] ease-in-out"
        style={{
          transform: animating
            ? "translateY(0%)"
            : direction === "up"
            ? "translateY(100%)"
            : "translateY(-100%)",
          opacity: animating ? 1 : 0,
        }}
      >
        {digit}
      </span>
    </span>
  );
}

export function Odometer({ value, className = "" }: OdometerProps) {
  const formatted = value.toLocaleString("en-US");
  const [displayed, setDisplayed] = useState(formatted);
  const prevRef = useRef(formatted);

  useEffect(() => {
    const next = value.toLocaleString("en-US");
    setDisplayed(next);
    prevRef.current = next;
  }, [value]);

  const currentChars = displayed.split("");
  const prevChars = prevRef.current.split("");

  // Pad shorter array on the left with spaces
  const maxLen = Math.max(currentChars.length, prevChars.length);
  const paddedCurrent = currentChars.join("").padStart(maxLen, " ").split("");
  const paddedPrev = prevChars.join("").padStart(maxLen, " ").split("");

  return (
    <span className={`inline-flex items-center ${className}`}>
      {paddedCurrent.map((char, i) => (
        <OdometerDigit key={i} digit={char} prevDigit={paddedPrev[i] ?? char} />
      ))}
    </span>
  );
}
