"use client";

/**
 * WebLLMSuggestions — shows 3 AI-generated prompt chips above the chatbox
 * when the on-device Lio 1.0 model is active and ready.
 *
 * The chips are generated from the current conversation context using the
 * local model. They re-generate whenever the last assistant message changes.
 */

import { useWebLLM } from "@/hooks/use-webllm";
import { cn } from "@/lib/utils";
import { SparklesIcon } from "@/components/chat/icons";
import type { ChatMessage } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const SUGGESTION_PROMPT = `Based on the conversation so far, suggest 3 short, distinct follow-up questions or prompts the user might want to ask next. 
Return ONLY a JSON array of 3 strings. No explanation, no markdown, no extra text. Just the JSON array.
Example: ["What are some examples?", "How does this compare to X?", "Can you simplify that?"]`;

interface WebLLMSuggestionsProps {
  messages: ChatMessage[];
  onSelect: (suggestion: string) => void;
  className?: string;
}

export function WebLLMSuggestions({
  messages,
  onSelect,
  className,
}: WebLLMSuggestionsProps) {
  const webllm = useWebLLM();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastAssistantTextRef = useRef<string>("");

  // Only show when model is active and ready
  const isVisible = webllm.isActive && webllm.status === "ready";

  useEffect(() => {
    if (!isVisible) {
      setSuggestions([]);
      return;
    }

    // Find the last assistant message text
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");

    if (!lastAssistant) return;

    const lastText = lastAssistant.parts
      ?.filter((p) => p.type === "text")
      .map((p) => ("text" in p ? p.text : ""))
      .join("") ?? "";

    // Don't re-generate if the assistant text hasn't changed
    if (lastText === lastAssistantTextRef.current || !lastText.trim()) return;
    lastAssistantTextRef.current = lastText;

    // Build conversation context (last 6 messages max to stay snappy)
    const context = messages
      .slice(-6)
      .flatMap((m) => {
        const text = m.parts
          ?.filter((p) => p.type === "text")
          .map((p) => ("text" in p ? p.text : ""))
          .join("");
        if (!text?.trim()) return [];
        return [{ role: m.role as "user" | "assistant", content: text }];
      });

    if (context.length === 0) return;

    setIsLoading(true);
    setSuggestions([]);

    const generationMessages: { role: "user" | "assistant" | "system"; content: string }[] = [
      ...context,
      { role: "user", content: SUGGESTION_PROMPT },
    ];

    let raw = "";

    webllm
      .generateResponse(generationMessages, (chunk) => {
        raw += chunk;
      })
      .then(() => {
        try {
          // Extract JSON array from the response
          const match = raw.match(/\[[\s\S]*?\]/);
          if (match) {
            const parsed = JSON.parse(match[0]) as string[];
            setSuggestions(
              parsed.slice(0, 3).map((s) => s.trim()).filter(Boolean)
            );
          }
        } catch {
          // Silently ignore bad JSON — suggestions are non-critical
        }
      })
      .catch(() => {
        // Non-critical — don't surface errors for suggestions
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [messages, isVisible, webllm]);

  if (!isVisible) return null;
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center gap-2 px-1 pb-2",
        className
      )}
      aria-label="Suggested prompts"
    >
      {/* Label */}
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground select-none">
        <SparklesIcon size={11} />
        <span>Suggestions</span>
      </div>

      {isLoading && (
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-7 w-24 animate-pulse rounded-full bg-muted"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </>
      )}

      {!isLoading &&
        suggestions.map((suggestion, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(suggestion)}
            className={cn(
              "group flex items-center rounded-full border border-border/70 bg-background",
              "px-3 py-1 text-[12px] text-foreground/80 shadow-[var(--shadow-card)]",
              "transition-all duration-150 hover:border-border hover:bg-muted/60 hover:text-foreground",
              "active:scale-[0.97] cursor-pointer"
            )}
          >
            {suggestion}
          </button>
        ))}
    </div>
  );
}
