"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadChannels, type Channel } from "@/components/chat/create-channel-modal";
import { ChannelView } from "@/components/chat/channel-view";

export default function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<Channel | null | undefined>(undefined);

  useEffect(() => {
    const channels = loadChannels();
    const found = channels.find((c) => c.id === id);
    setChannel(found ?? null);
  }, [id]);

  if (channel === undefined) {
    return (
      <div className="flex h-dvh items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (channel === null) {
    return (
      <div className="flex h-dvh items-center justify-center text-muted-foreground text-sm">
        Channel not found.
      </div>
    );
  }

  return <ChannelView channel={channel} />;
}
