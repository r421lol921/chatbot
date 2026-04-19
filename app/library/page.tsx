"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpenIcon,
  BookTextIcon,
  MusicIcon,
  PenLineIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";

export type LibraryItem = {
  id: string;
  title: string;
  kind: "essay" | "story" | "document" | "music";
  content: string;
  createdAt: string;
};

const KIND_COLORS: Record<LibraryItem["kind"], string> = {
  essay: "from-amber-950/80 to-amber-900/60",
  story: "from-emerald-950/80 to-emerald-900/60",
  document: "from-sky-950/80 to-sky-900/60",
  music: "from-purple-950/80 to-purple-900/60",
};

const KIND_SPINE: Record<LibraryItem["kind"], string> = {
  essay: "bg-amber-800",
  story: "bg-emerald-800",
  document: "bg-sky-800",
  music: "bg-purple-800",
};

const KIND_ICON: Record<LibraryItem["kind"], React.ReactNode> = {
  essay: <PenLineIcon className="size-4" />,
  story: <BookTextIcon className="size-4" />,
  document: <BookOpenIcon className="size-4" />,
  music: <MusicIcon className="size-4" />,
};

type ActionMenuProps = {
  onRead: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
};

function BookActionMenu({ onRead, onEdit, onRegenerate, onDelete }: ActionMenuProps) {
  return (
    <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-evenly w-10 rounded-r-lg bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 py-3">
      <button
        onClick={(e) => { e.stopPropagation(); onRead(); }}
        className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
        title="Read"
        type="button"
      >
        <BookOpenIcon className="size-3.5" />
        <span className="text-[8px] font-medium">Read</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
        title="Edit"
        type="button"
      >
        <PenLineIcon className="size-3.5" />
        <span className="text-[8px] font-medium">Edit</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
        className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
        title="Regenerate"
        type="button"
      >
        <RefreshCwIcon className="size-3.5" />
        <span className="text-[8px] font-medium">Regen</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex flex-col items-center gap-0.5 text-red-400 hover:text-red-300 transition-colors"
        title="Delete"
        type="button"
      >
        <Trash2Icon className="size-3.5" />
        <span className="text-[8px] font-medium">Delete</span>
      </button>
    </div>
  );
}

type ReadModalProps = {
  item: LibraryItem;
  onClose: () => void;
};

function ReadModal({ item, onClose }: ReadModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              {item.kind}
            </p>
            <h2 className="text-xl font-bold text-foreground">{item.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            type="button"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
        <div className="text-[13px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
          {item.content}
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "peytotoria_library";

function loadItems(): LibraryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: LibraryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [readItem, setReadItem] = useState<LibraryItem | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | LibraryItem["kind"]>("all");

  useEffect(() => {
    setItems(loadItems());
  }, []);

  const deleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveItems(updated);
  };

  const filteredItems =
    activeTab === "all" ? items : items.filter((i) => i.kind === activeTab);

  const tabs: Array<{ key: "all" | LibraryItem["kind"]; label: string }> = [
    { key: "all", label: "All" },
    { key: "essay", label: "Essays" },
    { key: "story", label: "Stories" },
    { key: "document", label: "Documents" },
    { key: "music", label: "Music" },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-5xl">
        {/* Back */}
        <Link
          href="/"
          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground mb-10 inline-block"
        >
          &larr; Back to chat
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Library
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Your AI-generated essays, stories, documents, and music.
            </p>
          </div>
          <Link
            href="/library/music"
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <MusicIcon className="size-3.5" />
            Music
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex items-center gap-1 border-b border-border/40 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-3 py-2 text-[13px] font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              type="button"
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute inset-x-0 bottom-0 h-px bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <BookOpenIcon className="size-6" />
            </div>
            <p className="text-[15px] font-medium text-foreground">
              Nothing here yet
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Saved outputs from chat will appear here as books.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative cursor-pointer"
                onClick={() => setReadItem(item)}
              >
                {/* Book body */}
                <div
                  className={`relative flex h-48 w-full flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-br ${KIND_COLORS[item.kind]} shadow-[var(--shadow-card)] ring-1 ring-border/20 transition-all duration-200 group-hover:ring-2 group-hover:ring-yellow-400/60 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]`}
                >
                  {/* Spine line */}
                  <div
                    className={`absolute inset-y-0 left-0 w-2.5 ${KIND_SPINE[item.kind]} opacity-70`}
                  />

                  {/* Kind icon */}
                  <div className="absolute top-3 right-3 text-white/40">
                    {KIND_ICON[item.kind]}
                  </div>

                  {/* Title */}
                  <div className="px-4 pb-3">
                    <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-white/90">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/40">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Action menu */}
                  <BookActionMenu
                    onDelete={() => deleteItem(item.id)}
                    onEdit={() => setReadItem(item)}
                    onRead={() => setReadItem(item)}
                    onRegenerate={() => {}}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {readItem && (
        <ReadModal item={readItem} onClose={() => setReadItem(null)} />
      )}
    </div>
  );
}
