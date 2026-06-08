"use client";

import { useCallback, useEffect, useState } from "react";

export type SavedChat = {
  id: string;
  title: string;
  createdAt: number;
};

const COOKIE_KEY = "lio_saved_chats";
const MAX_SAVED = 2;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function readCookie(): SavedChat[] {
  if (typeof document === "undefined") return [];
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_KEY}=`));
  if (!match) return [];
  try {
    return JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
  } catch {
    return [];
  }
}

function writeCookie(chats: SavedChat[]) {
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(chats))}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function useCookieChats() {
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);

  useEffect(() => {
    setSavedChats(readCookie());
  }, []);

  const saveChat = useCallback((chat: SavedChat) => {
    setSavedChats((prev) => {
      // Move to front if already saved, otherwise prepend and slice to max
      const filtered = prev.filter((c) => c.id !== chat.id);
      const updated = [chat, ...filtered].slice(0, MAX_SAVED);
      writeCookie(updated);
      return updated;
    });
  }, []);

  const removeChat = useCallback((id: string) => {
    setSavedChats((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      writeCookie(updated);
      return updated;
    });
  }, []);

  const isSaved = useCallback(
    (id: string) => savedChats.some((c) => c.id === id),
    [savedChats]
  );

  const isFull = savedChats.length >= MAX_SAVED;

  return { savedChats, saveChat, removeChat, isSaved, isFull, MAX_SAVED };
}
