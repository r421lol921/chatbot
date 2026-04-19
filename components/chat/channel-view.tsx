"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpIcon, EyeIcon, HashIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Channel, ChannelMessage } from "./create-channel-modal";
import { loadChannels, saveChannels } from "./create-channel-modal";
import { useWebLLM } from "@/hooks/use-webllm";

const LIO_MENTION = "@Lio";

/**
 * Odometer-style animated number for view counts.
 */
function AnimatedCount({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayed) {
      setAnimating(true);
      const t = setTimeout(() => {
        setDisplayed(value);
        setAnimating(false);
      }, 220);
      return () => clearTimeout(t);
    }
  }, [value, displayed]);

  return (
    <span
      className={cn(
        "inline-block transition-all duration-200",
        animating && "animate-[slide-down_0.22s_cubic-bezier(0.22,1,0.36,1)]"
      )}
    >
      {displayed}
    </span>
  );
}

export function ChannelView({ channel: initialChannel, currentUserEmail }: { channel: Channel; currentUserEmail?: string }) {
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const webllm = useWebLLM();

  // Increment view count when messages are viewed
  useEffect(() => {
    const updated = {
      ...channel,
      messages: channel.messages.map((m) => ({
        ...m,
        views: m.role === "user" || m.role === "assistant" ? m.views + 1 : m.views,
      })),
    };
    // Only persist if counts actually changed (avoid infinite loop)
    const changed = updated.messages.some((m, i) => m.views !== channel.messages[i]?.views);
    if (changed) {
      const all = loadChannels();
      const idx = all.findIndex((c) => c.id === channel.id);
      if (idx !== -1) {
        all[idx] = updated;
        saveChannels(all);
      }
      setChannel(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channel.messages]);

  const persistAndSet = useCallback((updated: Channel) => {
    const all = loadChannels();
    const idx = all.findIndex((c) => c.id === channel.id);
    if (idx !== -1) {
      all[idx] = updated;
    } else {
      all.unshift(updated);
    }
    saveChannels(all);
    setChannel(updated);
  }, [channel.id]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const userMsg: ChannelMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
      views: 1,
    };

    const updatedWithUser: Channel = {
      ...channel,
      messages: [...channel.messages, userMsg],
    };
    persistAndSet(updatedWithUser);

    // In channels, AI only responds when @Lio is mentioned
    const mentionsAI = channel.type === "channel" && text.includes(LIO_MENTION);
    // In group chats, AI always responds
    const shouldAIRespond = channel.type === "group" || mentionsAI;

    if (shouldAIRespond && webllm.status === "ready") {
      setIsLoading(true);
      const assistantId = crypto.randomUUID();
      const assistantMsg: ChannelMessage = {
        id: assistantId,
        role: "assistant",
        text: "",
        createdAt: new Date().toISOString(),
        views: 0,
      };

      const withAssistant: Channel = {
        ...updatedWithUser,
        messages: [...updatedWithUser.messages, assistantMsg],
      };
      persistAndSet(withAssistant);

      try {
        const history = updatedWithUser.messages.slice(-10).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.text,
        }));

        await webllm.generateResponse(history, (chunk) => {
          setChannel((prev) => {
            const msgs = prev.messages.map((m) =>
              m.id === assistantId ? { ...m, text: m.text + chunk } : m
            );
            const updated = { ...prev, messages: msgs };
            persistAndSet(updated);
            return updated;
          });
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [input, channel, webllm, persistAndSet]);

  const isChannel = channel.type === "channel";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 bg-sidebar px-4 py-3">
        {isChannel ? (
          <HashIcon className="size-4 text-muted-foreground" />
        ) : (
          <UsersIcon className="size-4 text-muted-foreground" />
        )}
        <span className="font-semibold text-sm text-foreground">{channel.name}</span>
        {isChannel && (
          <span className="ml-1 text-[11px] text-muted-foreground">
            {channel.members.length} member{channel.members.length !== 1 ? "s" : ""}
          </span>
        )}
        {isChannel && (
          <span className="ml-auto text-[10px] text-muted-foreground/60 select-none">
            Mention @Lio for AI response
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {channel.messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground/50">
            No messages yet. Say something{isChannel ? " or mention @Lio" : ""}!
          </div>
        )}
        {channel.messages.map((msg) => {
          const isAI = msg.role === "assistant";
          return (
            <div
              key={msg.id}
              className={cn(
                "group/msg w-full animate-[fade-up_0.25s_cubic-bezier(0.22,1,0.36,1)]",
              )}
            >
              {isAI ? (
                <div className="flex items-start gap-3">
                  <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
                      <SparklesIcon className="size-[13px]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[13px] leading-[1.65] text-foreground break-words [word-break:break-word]">
                      {msg.text || <span className="opacity-40 animate-pulse">Thinking...</span>}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                      <EyeIcon className="size-3" />
                      <AnimatedCount value={msg.views} />
                      <span className="text-muted-foreground/30">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <div className="max-w-[min(80%,56ch)] rounded-2xl rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted px-3.5 py-2 shadow-[var(--shadow-card)]">
                    <p className="text-[13px] leading-[1.65] text-foreground break-words [word-break:break-word]">
                      {msg.text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                    <EyeIcon className="size-3" />
                    <AnimatedCount value={msg.views} />
                    <span className="text-muted-foreground/30">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/40 bg-background px-4 pb-4 pt-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border/30 bg-card/70 px-3 py-2.5 shadow-[var(--shadow-composer)] transition-shadow focus-within:shadow-[var(--shadow-composer-focus)]">
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none bg-transparent text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/35 outline-none"
            placeholder={
              isChannel
                ? "Message the channel... (mention @Lio for AI)"
                : "Message the group..."
            }
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            type="button"
            disabled={!input.trim() || isLoading}
            onClick={sendMessage}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
              input.trim() && !isLoading
                ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                : "bg-muted text-muted-foreground/25 cursor-not-allowed"
            )}
          >
            <ArrowUpIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
