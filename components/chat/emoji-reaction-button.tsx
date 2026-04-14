"use client";

import { memo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import {
  MessageAction as Action,
} from "../ai-elements/message";

export function PureHeartReactionButton({
  chatId,
  messageId,
  isLiked,
  isLoading,
}: {
  chatId: string;
  messageId: string;
  isLiked: boolean;
  isLoading: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [liked, setLiked] = useState(isLiked);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return null;
  }

  const handleHeartReaction = async () => {
    setSubmitting(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/reactions`,
        {
          method: "POST",
          body: JSON.stringify({
            chatId,
            messageId,
            emoji: "❤️",
          }),
        }
      );

      setLiked(!liked);
      mutate(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/reactions?messageId=${messageId}`
      );
      toast.success(liked ? "Reaction removed" : "Reaction added");
    } catch (_error) {
      toast.error("Failed to update reaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Action
      className={`transition-colors ${
        liked
          ? "text-red-500 hover:text-red-600"
          : "text-muted-foreground/50 hover:text-red-500"
      } ${submitting ? "opacity-50" : ""}`}
      onClick={handleHeartReaction}
      disabled={submitting}
      tooltip={liked ? "Unlike" : "Like"}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </Action>
  );
}

export const HeartReactionButton = memo(PureHeartReactionButton);
