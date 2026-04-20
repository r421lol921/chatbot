"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpIcon,
  EyeIcon,
  GlobeIcon,
  HashIcon,
  HeartIcon,
  LockIcon,
  PanelLeftIcon,
  ReplyIcon,
  ShareIcon,
  SmileIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Channel, ChannelMessage } from "./create-channel-modal";
import { loadChannels, saveChannels } from "./create-channel-modal";
import { useWebLLM } from "@/hooks/use-webllm";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GIF_STICKER_MAP } from "./multimodal-input";

const LIO_MENTION = "@Lio";

// Animated sticker GIFs
const GIF_STICKERS: { src: string; alt: string; insert: string }[] = [
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/w_tunes.GIF-pHXpiJ3why5pH2NwQ1lzTkyutrw36V.gif", alt: "Kirby with headphones", insert: "[kirby]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/picsart220424212.PNG-xu0AXjWJSudSzTDCqOnSsGUu1nSCUR.png", alt: "Blue star", insert: "[star]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%3Acorazn%3A-115LCtC3BvXucsXfSJiBEpSQPoP8Pq.gif", alt: "Pink heart", insert: "[heart]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/whiteshake.GIF-zy1iXHtYXSF56Obw4hUM99sp6XdKHs.gif", alt: "White bunny", insert: "[bunny]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3D_Angry_Spunchbop.GIF-2ZLLoLcdrjT5dfZlNgW6ufXWCUqCVR.gif", alt: "Angry Spongebob", insert: "[spunchbop]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mine.PNG-tLO4enDEDSjNziY4LTHEePaWivo8Od.png", alt: "Minecraft grass block", insert: "[mine]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/spotify91.GIF-Jl3U0DdnDLTrN6XMxTGW6eBOduX7IW.gif", alt: "Spotify", insert: "[spotify]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/des_sleep.GIF-eo5RHzDSB6xVOVVPqXGd8du9IuZFol.gif", alt: "Sleeping Mario", insert: "[sleep]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hmhm.GIF-0UAMcaxvPQFCLykwR4CxFnnxHhy9Bn.gif", alt: "Thinking", insert: "[think]" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/59463dhearts.GIF-md1YyX4oZnluJf9uGQjaTSj8S4uuvo.gif", alt: "Two hearts", insert: "[hearts]" },
];

/** Render message text — replaces [tag] codes with inline GIF stickers */
function MessageText({ text }: { text: string }) {
  const parts = text.split(/(\[[a-z]+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const src = GIF_STICKER_MAP[part];
        if (src) {
          return (
            <img
              key={i}
              src={src}
              alt={part}
              className="inline-block h-8 w-8 object-contain align-middle"
            />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/** Odometer-style animated number */
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
        "inline-block tabular-nums transition-all duration-200",
        animating && "animate-[slide-down_0.22s_cubic-bezier(0.22,1,0.36,1)]"
      )}
    >
      {displayed}
    </span>
  );
}

type ChannelVisibility = "public" | "private";

export function ChannelView({
  channel: initialChannel,
}: {
  channel: Channel;
}) {
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visibility, setVisibility] = useState<ChannelVisibility>("private");
  const [replyTo, setReplyTo] = useState<{ role: string; text: string } | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const webllm = useWebLLM();
  const { toggleSidebar, isMobile, state: sidebarState } = useSidebar();

  // Increment view counts once on mount
  useEffect(() => {
    const updated = {
      ...channel,
      messages: channel.messages.map((m) => ({ ...m, views: m.views + 1 })),
    };
    const changed = updated.messages.some((m, i) => m.views !== channel.messages[i]?.views);
    if (changed) {
      const all = loadChannels();
      const idx = all.findIndex((c) => c.id === channel.id);
      if (idx !== -1) { all[idx] = updated; saveChannels(all); }
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
    if (idx !== -1) { all[idx] = updated; } else { all.unshift(updated); }
    saveChannels(all);
    setChannel(updated);
  }, [channel.id]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setReplyTo(null);

    const userMsg: ChannelMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
      views: 1,
    };
    const updatedWithUser: Channel = { ...channel, messages: [...channel.messages, userMsg] };
    persistAndSet(updatedWithUser);

    const mentionsAI = channel.type === "channel" && text.includes(LIO_MENTION);
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
      const withAssistant: Channel = { ...updatedWithUser, messages: [...updatedWithUser.messages, assistantMsg] };
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
            const up = { ...prev, messages: msgs };
            persistAndSet(up);
            return up;
          });
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [input, channel, webllm, persistAndSet]);

  const isChannel = channel.type === "channel";

  const toggleLike = useCallback((msgId: string) => {
    setChannel((prev) => {
      const msgs = prev.messages.map((m) => {
        if (m.id !== msgId) return m;
        const nowLiked = !m.liked;
        return {
          ...m,
          liked: nowLiked,
          likes: (m.likes ?? 0) + (nowLiked ? 1 : -1),
        };
      });
      const updated = { ...prev, messages: msgs };
      const all = loadChannels();
      const idx = all.findIndex((c) => c.id === prev.id);
      if (idx !== -1) { all[idx] = updated; saveChannels(all); }
      return updated;
    });
  }, []);

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      {/* Header — matches ChatHeader style exactly */}
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-sidebar px-3">
        {isMobile && (
          <Button className="md:hidden" onClick={toggleSidebar} size="icon-sm" variant="ghost">
            <PanelLeftIcon className="size-4" />
          </Button>
        )}
        {sidebarState === "collapsed" && !isMobile && (
          <Button onClick={toggleSidebar} size="icon-sm" variant="ghost">
            <PanelLeftIcon className="size-4" />
          </Button>
        )}

        {/* Visibility dropdown (Public / Private) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="gap-1.5 rounded-lg border-border/50 text-muted-foreground shadow-none transition-colors hover:text-foreground focus-visible:ring-0 active:translate-y-0"
              size="sm"
              variant="outline"
            >
              {visibility === "private" ? (
                <LockIcon className="size-3.5" />
              ) : (
                <GlobeIcon className="size-3.5" />
              )}
              <span className="text-[12px]">{visibility === "private" ? "Private" : "Public"}</span>
              <svg className="size-3 text-muted-foreground/60" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[260px]">
            <DropdownMenuItem
              className="flex flex-col items-start gap-0.5"
              onSelect={() => setVisibility("private")}
            >
              <span className="flex items-center gap-2 font-medium">
                <LockIcon className="size-3.5" /> Private
                {visibility === "private" && <span className="ml-auto text-emerald-500">&#10003;</span>}
              </span>
              <span className="text-xs text-muted-foreground">Only members can access this channel</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex flex-col items-start gap-0.5"
              onSelect={() => setVisibility("public")}
            >
              <span className="flex items-center gap-2 font-medium">
                <GlobeIcon className="size-3.5" /> Public
                {visibility === "public" && <span className="ml-auto text-emerald-500">&#10003;</span>}
              </span>
              <span className="text-xs text-muted-foreground">Anyone with the link can view this channel</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Channel name badge */}
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {isChannel ? <HashIcon className="size-4 text-muted-foreground" /> : <UsersIcon className="size-4 text-muted-foreground" />}
          {channel.name}
        </div>

        {isChannel && (
          <span className="ml-1 hidden text-[11px] text-muted-foreground md:inline">
            {channel.members.length} member{channel.members.length !== 1 ? "s" : ""}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isChannel && (
            <span className="hidden text-[10px] text-muted-foreground/60 select-none md:inline">
              Mention @Lio for AI response
            </span>
          )}
          <img src="/images/logo.png" alt="PeytOtoria" className="size-6 rounded-full" />
          <span className="hidden font-semibold text-sm md:block">PeytOtoria</span>
        </div>
      </header>

      {/* Main content area */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40">
        {/* Background pattern */}
        {channel.messages.length > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 chat-bg-pattern"
            style={{
              backgroundImage: "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vilkasss-pattern-10102410-ZriUf9ZEzMxRd04Y0W3WJAxprkKhWg.jpg')",
              backgroundSize: "380px 380px",
              backgroundRepeat: "repeat",
            }}
          />
        )}

        {/* Messages scroll container */}
        <div
          ref={messagesContainerRef}
          className="absolute inset-0 overflow-y-auto touch-pan-y"
        >
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-4 pb-2">
            {channel.messages.length === 0 && !isLoading && (
              <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-muted-foreground/50">
                No messages yet.{isChannel ? " Mention @Lio for AI." : ""}
              </div>
            )}

            {channel.messages.map((msg) => {
              const isAI = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className="group/message flex w-full animate-[fade-up_0.25s_cubic-bezier(0.22,1,0.36,1)]"
                >
                  {isAI ? (
                    /* AI message — left aligned, matches PreviewMessage assistant layout */
                    <div className="flex w-full items-start gap-3">
                      <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
                          <SparklesIcon className="size-[13px]" />
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="text-[13px] leading-[1.65] text-foreground break-words [word-break:break-word]">
                          {msg.text
                            ? <MessageText text={msg.text} />
                            : <span className="opacity-40 animate-pulse">Thinking...</span>
                          }
                        </p>
                        {/* Action bar + counts */}
                        <div className="flex items-center gap-2">
                          {/* Hover action bar */}
                          <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                                  onClick={() => setReplyTo({ role: "assistant", text: msg.text.slice(0, 120) })}
                                >
                                  <ReplyIcon className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Reply</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                                  onClick={() => handleShare(msg.text)}
                                >
                                  <ShareIcon className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Share</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className={cn(
                                    "flex h-6 items-center justify-center gap-0.5 rounded-md px-1 text-[10px] transition-colors hover:bg-muted",
                                    msg.liked ? "text-rose-500" : "text-muted-foreground/50 hover:text-rose-500"
                                  )}
                                  onClick={() => toggleLike(msg.id)}
                                >
                                  <HeartIcon className={cn("size-3.5", msg.liked && "fill-rose-500")} />
                                  {(msg.likes ?? 0) > 0 && <span>{msg.likes}</span>}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{msg.liked ? "Unlike" : "Like"}</TooltipContent>
                            </Tooltip>
                          </div>
                          {/* View count */}
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                            <EyeIcon className="size-3" />
                            <AnimatedCount value={msg.views} />
                          </div>
                          <span className="text-[10px] text-muted-foreground/30">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* User message — right aligned, matches PreviewMessage user layout */
                    <div className="flex w-full flex-col items-end gap-0">
                      <div className="w-fit max-w-[min(80%,56ch)] overflow-hidden break-words [word-break:break-word] rounded-2xl rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted px-3.5 py-2 shadow-[var(--shadow-card)]">
                        <p className="text-[13px] leading-[1.65] text-foreground">
                          <MessageText text={msg.text} />
                        </p>
                      </div>
                      {/* Action bar + counts */}
                      <div className="flex items-center gap-1.5 px-1 pt-0.5">
                        <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                                onClick={() => setReplyTo({ role: "user", text: msg.text.slice(0, 120) })}
                              >
                                <ReplyIcon className="size-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Reply</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                                onClick={() => handleShare(msg.text)}
                              >
                                <ShareIcon className="size-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Share</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "flex h-6 items-center justify-center gap-0.5 rounded-md px-1 text-[10px] transition-colors hover:bg-muted",
                                  msg.liked ? "text-rose-500" : "text-muted-foreground/50 hover:text-rose-500"
                                )}
                                onClick={() => toggleLike(msg.id)}
                              >
                                <HeartIcon className={cn("size-3.5", msg.liked && "fill-rose-500")} />
                                {(msg.likes ?? 0) > 0 && <span>{msg.likes}</span>}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{msg.liked ? "Unlike" : "Like"}</TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                          <EyeIcon className="size-3" />
                          <AnimatedCount value={msg.views} />
                        </div>
                        <span className="text-[10px] text-muted-foreground/30">
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
        </div>

        {/* Input bar — sticky at bottom, matches MultimodalInput style */}
        <div className="sticky bottom-0 z-10 w-full border-t-0 bg-background pt-1 pb-3 md:pb-4">
          <div className="mx-auto w-full max-w-4xl px-2 md:px-4">
            {replyTo && (
              <div className="mb-1 flex items-center gap-2 rounded-xl border border-border/30 bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                <ReplyIcon className="size-3 shrink-0 opacity-60" />
                <span className="flex-1 truncate leading-relaxed opacity-80">{replyTo.text}</span>
                <button
                  type="button"
                  className="ml-auto rounded p-0.5 transition-colors hover:bg-muted hover:text-foreground"
                  onMouseDown={(e) => { e.preventDefault(); setReplyTo(null); }}
                  aria-label="Cancel reply"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            )}

            <div className="flex flex-col rounded-2xl border border-border/30 bg-card/70 shadow-[var(--shadow-composer)] transition-shadow focus-within:shadow-[var(--shadow-composer-focus)]">
              <textarea
                ref={textareaRef}
                className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/35 outline-none"
                placeholder={isChannel ? "Message the channel... (mention @Lio for AI)" : "Message the group..."}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-grow
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <div className="flex items-center justify-between px-2 pb-2">
                {/* Left tools */}
                <div className="flex items-center gap-1" />
                {/* Right tools */}
                <div className="flex items-center gap-1">
                  {/* Emoji / sticker picker */}
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        className="h-7 w-7 rounded-lg border border-border/40 p-1 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                        title="Pick a sticker"
                        variant="ghost"
                        type="button"
                      >
                        <SmileIcon size={14} style={{ width: 14, height: 14 }} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" side="top" className="w-[240px] p-2" sideOffset={8}>
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 px-1">Stickers</p>
                      <div className="grid grid-cols-5 gap-1">
                        {GIF_STICKERS.map((sticker) => (
                          <button
                            key={sticker.insert}
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:bg-muted hover:scale-110 active:scale-95"
                            title={sticker.alt}
                            onClick={() => {
                              setInput((prev) => prev + sticker.insert);
                              setEmojiOpen(false);
                              textareaRef.current?.focus();
                            }}
                          >
                            <img src={sticker.src} alt={sticker.alt} className="h-8 w-8 object-contain" />
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Send button */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
