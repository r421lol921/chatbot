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
import { UsersIcon, XIcon } from "lucide-react";

export function PureGroupChatModal({
  chatId,
  isOpen,
  onOpenChange,
}: {
  chatId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddEmail = () => {
    const trimmed = emailInput.trim();
    if (trimmed && trimmed.includes("@")) {
      if (!emails.includes(trimmed)) {
        setEmails([...emails, trimmed]);
        setEmailInput("");
      } else {
        toast.error("Email already added");
      }
    } else {
      toast.error("Please enter a valid email");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleInvite = async () => {
    if (emails.length === 0) {
      toast.error("Please add at least one email");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/group-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, emails }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to invite members");
      }

      toast.success(`${emails.length} member${emails.length !== 1 ? "s" : ""} added to this chat`);
      setEmails([]);
      onOpenChange(false);
    } catch (_error) {
      toast.error("Failed to send invitations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersIcon className="size-4" />
            Invite to Group Chat
          </DialogTitle>
          <DialogDescription>
            Add people by email to collaborate in this chat alongside the AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
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
            >
              Add
            </Button>
          </div>

          {emails.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Inviting {emails.length} member{emails.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-1">
                {emails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="ml-2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Remove ${email}`}
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleInvite}
            disabled={emails.length === 0 || loading}
            className="w-full"
          >
            {loading
              ? "Sending invitations..."
              : emails.length === 0
              ? "Add emails above"
              : `Invite ${emails.length} Member${emails.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const GroupChatModal = memo(PureGroupChatModal);
