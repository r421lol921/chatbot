"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { EyeIcon, GlobeIcon, RefreshCwIcon } from "lucide-react";
import { Odometer } from "@/components/ui/odometer";

interface PublicChat {
  id: string;
  title: string;
  createdAt: string;
  viewCount: number;
}

function useVisitorId(): string {
  const [id, setId] = useState("");
  useEffect(() => {
    let vid = localStorage.getItem("_vid");
    if (!vid) {
      vid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("_vid", vid);
    }
    setId(vid);
  }, []);
  return id;
}

function ChatCard({ chat, onView }: { chat: PublicChat; onView: (id: string) => void }) {
  const [views, setViews] = useState(chat.viewCount);

  // Simulate a tick-up when mounted (reflects the new view being counted)
  useEffect(() => {
    const t = setTimeout(() => setViews((v) => v + 1), 800);
    return () => clearTimeout(t);
  }, []);

  const date = new Date(chat.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/chat/${chat.id}`}
      onClick={() => onView(chat.id)}
      className="group block rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="truncate text-[14px] font-semibold text-foreground group-hover:text-foreground/80">
            {chat.title}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{date}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1">
          <EyeIcon className="size-3 text-muted-foreground" />
          <Odometer value={views} className="text-[11px] text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

export default function PublicChatsPage() {
  const [chats, setChats] = useState<PublicChat[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const visitorId = useVisitorId();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/public-chats");
      const data = await res.json();
      setChats(data.chats ?? []);
      setTotalViews(data.totalViews ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleView = useCallback(
    (chatId: string) => {
      if (!visitorId) return;
      fetch("/api/public-chats/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, visitorId }),
      });
      setTotalViews((v) => v + 1);
    },
    [visitorId]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GlobeIcon className="size-4 text-foreground/60" />
              <h1 className="text-xl font-bold text-foreground">Public Chats</h1>
            </div>
            <p className="text-[12px] text-muted-foreground">
              5 randomly selected public conversations
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RefreshCwIcon className="size-3.5" />
            Shuffle
          </button>
        </div>

        {/* Total view count */}
        <div className="mb-6 rounded-2xl border border-border bg-card px-5 py-4">
          <p className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-widest">
            Total views across all public chats
          </p>
          <div className="flex items-baseline gap-1">
            <Odometer
              value={totalViews}
              className="text-3xl font-bold text-foreground"
            />
            <span className="text-[12px] text-muted-foreground ml-1">views</span>
          </div>
        </div>

        {/* Chat list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[68px] rounded-2xl border border-border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <GlobeIcon className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-[13px] text-muted-foreground">
              No public chats yet. Make a chat public from the chat settings!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chats.map((chat) => (
              <ChatCard key={chat.id} chat={chat} onView={handleView} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
