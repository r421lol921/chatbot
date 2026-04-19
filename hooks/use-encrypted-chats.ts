"use client";

import { useCallback, useEffect, useState } from "react";

export type EncryptedMessage = {
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export type EncryptedChat = {
  id: string;
  title: string;
  messages: EncryptedMessage[];
  createdAt: string;
};

const STORAGE_KEY = "peytotoria_encrypted_chats";
const MAX_ENCRYPTED_CHATS = 3;
const MAX_MESSAGES_PER_CHAT = 3;

function load(): EncryptedChat[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persist(chats: EncryptedChat[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function useEncryptedChats() {
  const [chats, setChats] = useState<EncryptedChat[]>([]);

  useEffect(() => {
    setChats(load());
  }, []);

  const canCreateEncrypted = chats.length < MAX_ENCRYPTED_CHATS;

  const createEncryptedChat = useCallback(
    (id: string, title = "Encrypted chat") => {
      if (!canCreateEncrypted) return false;
      const newChat: EncryptedChat = {
        id,
        title,
        messages: [],
        createdAt: new Date().toISOString(),
      };
      const updated = [newChat, ...chats];
      setChats(updated);
      persist(updated);
      return true;
    },
    [chats, canCreateEncrypted]
  );

  const addMessage = useCallback(
    (chatId: string, message: EncryptedMessage) => {
      const updated = chats.map((c) => {
        if (c.id !== chatId) return c;
        // Enforce max 3 messages per encrypted chat
        const newMessages = [...c.messages, message].slice(-MAX_MESSAGES_PER_CHAT * 2);
        return { ...c, messages: newMessages };
      });
      setChats(updated);
      persist(updated);
    },
    [chats]
  );

  const updateTitle = useCallback(
    (chatId: string, title: string) => {
      const updated = chats.map((c) => (c.id === chatId ? { ...c, title } : c));
      setChats(updated);
      persist(updated);
    },
    [chats]
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      const updated = chats.filter((c) => c.id !== chatId);
      setChats(updated);
      persist(updated);
    },
    [chats]
  );

  const getChat = useCallback(
    (chatId: string) => chats.find((c) => c.id === chatId) ?? null,
    [chats]
  );

  const isEncryptedChat = useCallback(
    (chatId: string) => chats.some((c) => c.id === chatId),
    [chats]
  );

  const isAtMessageLimit = useCallback(
    (chatId: string) => {
      const chat = chats.find((c) => c.id === chatId);
      if (!chat) return false;
      // Count only user messages
      const userMessages = chat.messages.filter((m) => m.role === "user");
      return userMessages.length >= MAX_MESSAGES_PER_CHAT;
    },
    [chats]
  );

  return {
    chats,
    canCreateEncrypted,
    maxChats: MAX_ENCRYPTED_CHATS,
    maxMessages: MAX_MESSAGES_PER_CHAT,
    createEncryptedChat,
    addMessage,
    updateTitle,
    deleteChat,
    getChat,
    isEncryptedChat,
    isAtMessageLimit,
  };
}
