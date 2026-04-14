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
import { PlusIcon } from "./icons";

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
    if (emailInput.trim() && emailInput.includes("@")) {
      if (!emails.includes(emailInput.trim())) {
        setEmails([...emails, emailInput.trim()]);
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
          body: JSON.stringify({
            chatId,
            emails,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to invite members");
      }

      toast.success(`Invitations sent to ${emails.length} member(s)`);
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
            <PlusIcon className="size-5" />
            Invite to Group Chat
          </DialogTitle>
          <DialogDescription>
            Add members to this chat by email address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddEmail}
              variant="secondary"
            >
              Add
            </Button>
          </div>

          {emails.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Members to invite:</p>
              <div className="space-y-1">
                {emails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between rounded-lg bg-muted p-2 text-sm"
                  >
                    <span>{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
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
            {loading ? "Sending..." : `Invite ${emails.length} Member${emails.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const GroupChatModal = memo(PureGroupChatModal);
