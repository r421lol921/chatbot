import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Chat } from "@/lib/db/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "./icons";

// Format a relative creation time like "3h ago"
function useTimeUntilDeletion(createdAt: string | Date, hoursLimit = 3): string {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => {
      const created = new Date(createdAt).getTime();
      const deleteAt = created + hoursLimit * 60 * 60 * 1000;
      const remaining = deleteAt - Date.now();
      if (remaining <= 0) {
        setLabel("Expiring soon");
        return;
      }
      const h = Math.floor(remaining / (1000 * 60 * 60));
      const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      if (h > 0) setLabel(`${h}h ${m}m left`);
      else setLabel(`${m}m left`);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [createdAt, hoursLimit]);

  return label;
}

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });
  const timeLeft = useTimeUntilDeletion(chat.createdAt);

  // Format the created-at date
  const createdDateStr = new Date(chat.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="h-auto rounded-none text-[13px] text-sidebar-foreground/50 transition-all duration-150 hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:font-normal data-active:text-sidebar-foreground/50 data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium data-[active=true]:border-b data-[active=true]:border-dashed data-[active=true]:border-sidebar-foreground/50"
        isActive={isActive}
      >
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)} className="flex flex-col gap-0.5 py-1">
          <span className="truncate">{chat.title}</span>
          {/* Unencrypted badge with skull + metadata */}
          <span className="flex items-center gap-1 text-[10px] text-sidebar-foreground/40 font-normal">
            <svg viewBox="0 0 16 16" className="size-2.5 shrink-0 text-sidebar-foreground/60" fill="currentColor" aria-hidden="true">
              <path d="M8 1a5 5 0 0 0-4 8l.3.5V12a1 1 0 0 0 1 1h1v1a.5.5 0 0 0 1 0v-1h1.5v1a.5.5 0 0 0 1 0v-1H11a1 1 0 0 0 1-1v-2.5l.3-.5A5 5 0 0 0 8 1zm-1.5 9a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"/>
            </svg>
            <span className="font-semibold text-sidebar-foreground/50">Unencrypted</span>
          </span>
          <span className="flex items-center gap-1 text-[9px] text-sidebar-foreground/30 font-normal">
            <span className="shrink-0">Chat Created</span>
            <span className="h-px flex-1 bg-sidebar-foreground/15" />
            <span className="shrink-0">{createdDateStr}</span>
          </span>
          <span className="text-[9px] text-sidebar-foreground/30">
            Time Until Deletion: <span className="font-medium text-sidebar-foreground/50">{timeLeft}</span>
          </span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="mr-0.5 rounded-md text-sidebar-foreground/50 ring-0 transition-colors duration-150 focus-visible:ring-0 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType("private");
                  }}
                >
                  <div className="flex flex-row items-center gap-2">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === "private" ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType("public");
                  }}
                >
                  <div className="flex flex-row items-center gap-2">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === "public" ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            onSelect={() => onDelete(chat.id)}
            variant="destructive"
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) {
    return false;
  }
  return true;
});
