"use client";

import { memo, useRef, useState } from "react";
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
import { HashIcon, ImageIcon, UsersIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChannelType = "group" | "channel";

export type Channel = {
  id: string;
  name: string;
  type: ChannelType;
  members: string[];
  createdAt: string;
  messages: ChannelMessage[];
  /** Base64 data URL of the uploaded icon/gif */
  icon?: string;
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
  editingChannel,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (channel: Channel) => void;
  /** When set, the modal is in edit mode for this channel */
  editingChannel?: Channel | null;
}) {
  const [channelType, setChannelType] = useState<ChannelType>(editingChannel?.type ?? "group");
  const [channelName, setChannelName] = useState(editingChannel?.name ?? "");
  const [emails, setEmails] = useState<string[]>(editingChannel?.members ?? []);
  const [emailInput, setEmailInput] = useState("");
  const [iconDataUrl, setIconDataUrl] = useState<string | undefined>(editingChannel?.icon);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Sync state when editingChannel changes
  const prevEditing = useRef<string | undefined>(undefined);
  if (editingChannel?.id !== prevEditing.current) {
    prevEditing.current = editingChannel?.id;
    // Only update on actual change to avoid infinite renders
  }

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Icon must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setIconDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

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
    const trimmedName = channelName.trim();
    if (!trimmedName) {
      toast.error("Enter a name for your " + (channelType === "group" ? "group" : "channel"));
      return;
    }

    const existing = loadChannels();

    // Unique name check (exclude self when editing)
    const duplicate = existing.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingChannel?.id
    );
    if (duplicate) {
      toast.error(`A ${duplicate.type === "group" ? "group chat" : "channel"} named "${trimmedName}" already exists`);
      return;
    }

    if (editingChannel) {
      // Edit mode — update in place
      const updated: Channel = { ...editingChannel, name: trimmedName, type: channelType, members: emails, icon: iconDataUrl };
      const idx = existing.findIndex((c) => c.id === editingChannel.id);
      if (idx !== -1) existing[idx] = updated;
      saveChannels(existing);
      toast.success("Updated!");
      onCreated?.(updated);
    } else {
      const newChannel: Channel = {
        id: crypto.randomUUID(),
        name: trimmedName,
        type: channelType,
        members: emails,
        createdAt: new Date().toISOString(),
        messages: [],
        icon: iconDataUrl,
      };
      saveChannels([newChannel, ...existing]);
      toast.success(`${channelType === "group" ? "Group chat" : "Channel"} "${newChannel.name}" created!`);
      onCreated?.(newChannel);
    }

    onOpenChange(false);
    setChannelName("");
    setEmails([]);
    setEmailInput("");
    setIconDataUrl(undefined);
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
            {editingChannel ? "Edit" : "Create"}
          </DialogTitle>
          <DialogDescription>
            {editingChannel
              ? "Update the name, icon, or members of your group or channel."
              : "Create a new group chat or channel. Optionally invite members by email."}
          </DialogDescription>
        </DialogHeader>

        {/* Icon upload */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => iconInputRef.current?.click()}
            className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/60 bg-muted/40 transition-colors hover:border-border hover:bg-muted"
            title="Upload icon or GIF"
          >
            {iconDataUrl ? (
              <img src={iconDataUrl} alt="icon preview" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-5 text-muted-foreground/50" />
            )}
          </button>
          <input
            ref={iconInputRef}
            type="file"
            accept="image/*,.gif"
            className="hidden"
            onChange={handleIconChange}
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-[13px] font-medium">Icon</p>
            <p className="text-[11px] text-muted-foreground">Upload an image or GIF (max 2MB)</p>
            {iconDataUrl && (
              <button
                type="button"
                className="mt-0.5 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => setIconDataUrl(undefined)}
              >
                Remove
              </button>
            )}
          </div>
        </div>

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
            {editingChannel ? "Save Changes" : `Create ${channelType === "group" ? "Group Chat" : "Channel"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const CreateChannelModal = memo(PureCreateChannelModal);
