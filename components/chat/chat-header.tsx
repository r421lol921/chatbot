"use client";

import { LockIcon, PanelLeftIcon, ShieldAlertIcon, UsersIcon } from "lucide-react";
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
  isEncrypted,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  isEncrypted?: boolean;
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

      {/* Encryption badge */}
      {isEncrypted !== undefined && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium select-none ${
                isEncrypted
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isEncrypted ? (
                <>
                  {/* Cutout lock icon */}
                  <svg
                    className="size-3 shrink-0"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    <circle cx="8" cy="11" r="1" fill="currentColor"/>
                  </svg>
                  Encrypted
                </>
              ) : (
                <>
                  <ShieldAlertIcon className="size-3 shrink-0" />
                  Unencrypted
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isEncrypted
              ? "This chat is stored only in your browser. Encrypted."
              : "This chat is stored on our servers. Not encrypted."}
          </TooltipContent>
        </Tooltip>
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
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.isEncrypted === nextProps.isEncrypted
  );
});
