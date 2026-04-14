"use client";

import { PanelLeftIcon, UsersIcon } from "lucide-react";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { GroupChatModal } from "./group-chat-modal";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  if (state === "collapsed" && !isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 flex h-14 items-center gap-2 bg-sidebar px-3">
      <Button
        className="md:hidden"
        onClick={toggleSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <PanelLeftIcon className="size-4" />
      </Button>

      <img src="/images/logo.png" alt="PeytOtoria" className="size-6 rounded-full md:hidden" />
      <span className="font-semibold text-sm md:hidden">PeytOtoria</span>

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      <div className="ml-auto flex items-center gap-2">
        {!isReadonly && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-7 rounded-lg border border-border/40 p-0 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                onClick={() => setGroupModalOpen(true)}
                size="icon"
                variant="ghost"
                aria-label="Invite to group chat"
              >
                <UsersIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Invite to group chat</TooltipContent>
          </Tooltip>
        )}
        <img src="/images/logo.png" alt="PeytOtoria" className="hidden size-6 rounded-full md:block" />
        <span className="hidden font-semibold text-sm md:block">PeytOtoria</span>
      </div>

      <GroupChatModal
        chatId={chatId}
        isOpen={groupModalOpen}
        onOpenChange={setGroupModalOpen}
      />
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});
