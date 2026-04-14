"use client";

import { memo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShareIcon } from "./icons";

export function PureShareModal({
  chatId,
  isOpen,
  onOpenChange,
}: {
  chatId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [shareLink, setShareLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();

  useEffect(() => {
    if (isOpen) {
      generateShareLink();
    }
  }, [isOpen]);

  const generateShareLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat-share`,
        {
          method: "POST",
          body: JSON.stringify({ chatId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate share link");
      }

      const data = await response.json();
      const link = `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/share/${data.shareToken}`;
      setShareLink(link);
    } catch (_error) {
      toast.error("Failed to generate share link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(shareLink);
    toast.success("Share link copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShareIcon className="size-5" />
            Share Chat
          </DialogTitle>
          <DialogDescription>
            Share this chat with others using the link below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={shareLink}
              className="flex-1 text-sm"
              placeholder="Generating share link..."
            />
            <Button
              size="sm"
              onClick={handleCopy}
              disabled={!shareLink || loading}
              className="shrink-0"
            >
              {loading ? "Generating..." : "Copy"}
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Anyone with this link can view this chat conversation.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ShareModal = memo(PureShareModal);
