"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EyeIcon, GlobeIcon, PencilIcon, RefreshCwIcon, CheckIcon, XIcon } from "lucide-react";
import { Odometer } from "@/components/ui/odometer";

interface PublicChat {
  id: string;
  title: string;
  createdAt: string;
  viewCount: number;
}


function EditableViewCount({
  chatId,
  initialValue,
  className,
  onSaved,
}: {
  chatId: string | null;
  initialValue: number;
  className?: string;
  onSaved?: (newValue: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(initialValue));
  const [saving, setSaving] = useState(false);
  const [display, setDisplay] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplay(initialValue);
    setInputVal(String(initialValue));
  }, [initialValue]);

  const startEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInputVal(String(display));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const cancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing(false);
  };

  const save = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const n = parseInt(inputVal, 10);
    if (isNaN(n) || n < 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const endpoint = chatId
        ? "/api/admin/set-view-count"
        : "/api/admin/set-total-views";
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatId ? { chatId, count: n } : { count: n }),
      });
      setDisplay(n);
      onSaved?.(n);
    } catch {
      // ignore
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="number"
          min={0}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save(e as unknown as React.MouseEvent);
            if (e.key === "Escape") setEditing(false);
          }}
          className={`w-20 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 ${className}`}
        />
        <button onClick={save} disabled={saving} className="text-foreground/70 hover:text-foreground">
          <CheckIcon className="size-3" />
        </button>
        <button onClick={cancel} className="text-muted-foreground hover:text-foreground">
          <XIcon className="size-3" />
        </button>
      </span>
    );
  }

  return (
    <span className="group/edit flex items-center gap-1">
      <Odometer value={display} className={className} />
      <button
        onClick={startEdit}
        className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        title="Edit view count"
      >
        <PencilIcon className="size-2.5" />
      </button>
    </span>
  );
}

function ChatCard({ chat }: { chat: PublicChat }) {
  const [views, setViews] = useState(chat.viewCount);

  // Keep local state in sync if the parent refreshes the chat list
  useEffect(() => {
    setViews(chat.viewCount);
  }, [chat.viewCount]);

  const date = new Date(chat.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/chat/${chat.id}`}
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
          <EditableViewCount
            chatId={chat.id}
            initialValue={views}
            onSaved={setViews}
            className="text-[11px] text-muted-foreground"
          />
        </div>
      </div>
    </Link>
  );
}

export default function PublicChatsPage() {
  const [chats, setChats] = useState<PublicChat[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

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
            <EditableViewCount
              chatId={null}
              initialValue={totalViews}
              onSaved={setTotalViews}
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
              <ChatCard key={chat.id} chat={chat} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
