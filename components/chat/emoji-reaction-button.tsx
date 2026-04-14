"use client";

import { memo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import { SmileIcon } from "./icons";

const EMOJI_REACTIONS = ["👍", "❤️", "😄", "🤔", "🎉", "🔥"];

export function PureEmojiReactionButton({
  chatId,
  messageId,
  reactions,
  isLoading,
}: {
  chatId: string;
  messageId: string;
  reactions: Array<{ emoji: string; count: number; userReacted: boolean }>;
  isLoading: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return null;
  }

  const handleReaction = async (emoji: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/reactions`,
        {
          method: "POST",
          body: JSON.stringify({
            chatId,
            messageId,
            emoji,
          }),
        }
      );

      mutate(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/reactions?messageId=${messageId}`
      );
      setOpen(false);
      toast.success("Reaction added!");
    } catch (_error) {
      toast.error("Failed to add reaction");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Action
          className="text-muted-foreground/50 hover:text-foreground"
          tooltip="Add reaction"
        >
          <SmileIcon />
        </Action>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="grid grid-cols-3 gap-2 p-2">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="flex h-8 items-center justify-center rounded text-xl hover:bg-muted"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const EmojiReactionButton = memo(PureEmojiReactionButton);
