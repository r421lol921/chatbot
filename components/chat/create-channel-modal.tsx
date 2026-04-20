"use client";

import { memo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HashIcon, UsersIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChannelType = "group" | "channel";

export type Channel = {
  id: string;
  name: string;
  type: ChannelType;
  members: string[];
  createdAt: string;
  messages: ChannelMessage[];
};

export type ChannelMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  views: number;
  liked?: boolean;
  likes?: number;
};

const CHANNELS_STORAGE_KEY = "peytotoria_channels";

export function loadChannels(): Channel[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CHANNELS_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveChannels(channels: Channel[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(channels));
}

export function PureCreateChannelModal({
  isOpen,
  onOpenChange,
  onCreated,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (channel: Channel) => void;
}) {
  const [channelType, setChannelType] = useState<ChannelType>("group");
  const [channelName, setChannelName] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  const handleAddEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    if (emails.includes(trimmed)) {
      toast.error("Email already added");
      return;
    }
    setEmails((prev) => [...prev, trimmed]);
    setEmailInput("");
  };

  const handleCreate = () => {
    if (!channelName.trim()) {
      toast.error("Enter a name for your " + (channelType === "group" ? "group" : "channel"));
      return;
    }

    const newChannel: Channel = {
      id: crypto.randomUUID(),
      name: channelName.trim(),
      type: channelType,
      members: emails,
      createdAt: new Date().toISOString(),
      messages: [],
    };

    const existing = loadChannels();
    saveChannels([newChannel, ...existing]);

    toast.success(`${channelType === "group" ? "Group chat" : "Channel"} "${newChannel.name}" created!`);
    onCreated?.(newChannel);
    onOpenChange(false);
    setChannelName("");
    setEmails([]);
    setEmailInput("");
    setChannelType("group");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {channelType === "channel" ? (
              <HashIcon className="size-4" />
            ) : (
              <UsersIcon className="size-4" />
            )}
            Create
          </DialogTitle>
          <DialogDescription>
            Create a new group chat or channel. Optionally invite members by email.
          </DialogDescription>
        </DialogHeader>

        {/* Type Selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setChannelType("group")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-[13px] font-medium transition-colors",
              channelType === "group"
                ? "border-foreground/30 bg-foreground/5 text-foreground"
                : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <UsersIcon className="size-3.5" />
            Group Chat
          </button>
          <button
            type="button"
            onClick={() => setChannelType("channel")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-[13px] font-medium transition-colors",
              channelType === "channel"
                ? "border-foreground/30 bg-foreground/5 text-foreground"
                : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <HashIcon className="size-3.5" />
            Channel
          </button>
        </div>

        <div className="space-y-3">
          {/* Name */}
          <Input
            placeholder={channelType === "group" ? "Group name..." : "Channel name..."}
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="text-sm"
          />

          {/* Email invite */}
          <div className="flex gap-2">
            <Input
              placeholder="Invite by email (optional)"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
              className="flex-1 text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddEmail}
              variant="secondary"
              disabled={!emailInput.trim()}
              type="button"
            >
              Add
            </Button>
          </div>

          {emails.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {emails.length} member{emails.length !== 1 ? "s" : ""}
              </p>
              {emails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="text-foreground">{email}</span>
                  <button
                    onClick={() => setEmails((prev) => prev.filter((e) => e !== email))}
                    className="ml-2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={`Remove ${email}`}
                    type="button"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleCreate} disabled={!channelName.trim()} className="w-full" type="button">
            Create {channelType === "group" ? "Group Chat" : "Channel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const CreateChannelModal = memo(PureCreateChannelModal);
