"use client";

import {
  BookOpenIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  PenSquareIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  TrashIcon,
  UsersIcon,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
type User = { id?: string; email?: string | null; name?: string | null; image?: string | null };
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { CreateChannelModal, loadChannels, saveChannels, type Channel } from "./create-channel-modal";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
import type { UserType } from "@/app/(auth)/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "@/lib/utils";

// ─── ChannelItem ───────────────────────────────────────────────────────────────

function ChannelItem({
  channel,
  isActive,
  onEdit,
  onDelete,
  setOpenMobile,
}: {
  channel: Channel;
  isActive: boolean;
  onEdit: (ch: Channel) => void;
  onDelete: (ch: Channel) => void;
  setOpenMobile: (open: boolean) => void;
}) {
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/channel/${channel.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  }, [channel.id]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="rounded-lg text-sidebar-foreground/60 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        tooltip={channel.name}
      >
        <Link href={`/channel/${channel.id}`} onClick={() => setOpenMobile(false)}>
          {/* Icon: uploaded image/gif OR fallback icon */}
          {channel.icon ? (
            <img
              src={channel.icon}
              alt={channel.name}
              className="size-5 shrink-0 rounded-md object-cover"
            />
          ) : channel.type === "channel" ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted/60 text-[11px] font-bold text-sidebar-foreground/60 leading-none select-none">
              #
            </span>
          ) : (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted/60 text-sidebar-foreground/60">
              <UsersIcon className="size-3" />
            </span>
          )}
          <span className="text-[13px] truncate">{channel.name}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="mr-0.5 rounded-md text-sidebar-foreground/50 ring-0 transition-colors duration-150 focus-visible:ring-0 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="w-40">
          <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleShare}>
            <ShareIcon className="size-4" />
            <span>Share</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => onEdit(channel)}>
            <PencilIcon className="size-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            variant="destructive"
            onClick={() => onDelete(channel)}
          >
            <TrashIcon className="size-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

// ─── AppSidebar ────────────────────────────────────────────────────────────────

export function AppSidebar({ user, userType }: { user: User | undefined; userType?: UserType }) {
  const router = useRouter();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [search, setSearch] = useState("");

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    setChannels(loadChannels());
  }, []);

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(false);
    router.replace("/");
    mutate(unstable_serialize(getChatHistoryPaginationKey), [], {
      revalidate: false,
    });
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
      method: "DELETE",
    });
    toast.success("All chats deleted");
  };

  const handleChannelUpdated = useCallback((ch: Channel) => {
    setChannels((prev) => {
      const idx = prev.findIndex((c) => c.id === ch.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = ch;
        return next;
      }
      return [ch, ...prev];
    });
    setEditingChannel(null);
    setCreateModalOpen(false);
  }, []);

  const handleDeleteChannel = useCallback(() => {
    if (!deletingChannel) return;
    const updated = loadChannels().filter((c) => c.id !== deletingChannel.id);
    saveChannels(updated);
    setChannels(updated);
    setDeletingChannel(null);
    router.replace("/");
    toast.success(`"${deletingChannel.name}" deleted`);
  }, [deletingChannel, router]);

  const openEdit = useCallback((ch: Channel) => {
    setEditingChannel(ch);
    setCreateModalOpen(true);
  }, []);

  const filteredChannels = search.trim()
    ? channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : channels;

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-0 pt-3">
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-row items-center justify-between">
              <div className="group/logo relative flex items-center justify-center">
                <SidebarMenuButton
                  asChild
                  className="size-8 !px-0 items-center justify-center group-data-[collapsible=icon]:group-hover/logo:opacity-0"
                  tooltip="PeytOtoria"
                >
                  <Link href="/" onClick={() => setOpenMobile(false)}>
                    <img
                      src="/images/logo.png"
                      alt="PeytOtoria"
                      className="size-6 rounded-full object-cover shrink-0"
                    />
                  </Link>
                </SidebarMenuButton>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      className="pointer-events-none absolute inset-0 size-8 opacity-0 group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:group-hover/logo:opacity-100"
                      onClick={() => toggleSidebar()}
                    >
                      <PanelLeftIcon className="size-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent className="hidden md:block" side="right">
                    Open sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <SidebarTrigger className="text-sidebar-foreground/60 transition-all duration-200 hover:text-sidebar-foreground hover:rotate-180" />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="pt-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Search bar */}
                <SidebarMenuItem className="group-data-[collapsible=icon]:hidden mb-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-sidebar-foreground/40 pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className={cn(
                        "w-full rounded-lg border border-sidebar-border bg-sidebar-accent/30 py-1.5 pl-8 pr-3",
                        "text-[13px] text-sidebar-foreground placeholder:text-sidebar-foreground/40",
                        "outline-none focus:border-sidebar-border/80 focus:bg-sidebar-accent/50 transition-colors"
                      )}
                    />
                  </div>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-8 rounded-lg border border-sidebar-border text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push("/");
                    }}
                    tooltip="New Chat"
                  >
                    <PenSquareIcon className="size-4" />
                    <span className="font-medium">New chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="rounded-lg text-sidebar-foreground/40 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setShowDeleteAllDialog(true)}
                      tooltip="Delete All Chats"
                    >
                      <TrashIcon className="size-4" />
                      <span className="text-[13px]">Delete all</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="rounded-lg text-sidebar-foreground/60 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    tooltip="Library"
                  >
                    <Link href="/library" onClick={() => setOpenMobile(false)}>
                      <BookOpenIcon className="size-4" />
                      <span className="text-[13px]">Library</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="rounded-lg text-sidebar-foreground/60 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    onClick={() => {
                      setEditingChannel(null);
                      setCreateModalOpen(true);
                    }}
                    tooltip="Create"
                  >
                    <PlusIcon className="size-4" />
                    <span className="text-[13px]">Create</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Channels / Groups list */}
                {filteredChannels.length > 0 && (
                  <>
                    <div className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
                      {search ? `Results (${filteredChannels.length})` : "Channels & Groups"}
                    </div>
                    {filteredChannels.map((ch) => (
                      <ChannelItem
                        key={ch.id}
                        channel={ch}
                        isActive={pathname === `/channel/${ch.id}`}
                        onEdit={openEdit}
                        onDelete={setDeletingChannel}
                        setOpenMobile={setOpenMobile}
                      />
                    ))}
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarHistory user={user} />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border pt-2 pb-3">
          {user ? (
            <SidebarUserNav user={user} userType={userType} />
          ) : (
            <div className="flex flex-col gap-1.5 px-2 group-data-[collapsible=icon]:hidden">
              <Link
                className="flex h-8 w-full items-center justify-center rounded-lg bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
                href="/register"
              >
                Sign up for free
              </Link>
              <Link
                className="flex h-8 w-full items-center justify-center rounded-lg text-[13px] text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
                href="/login"
              >
                Sign in
              </Link>
            </div>
          )}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Create / Edit modal */}
      <CreateChannelModal
        isOpen={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setEditingChannel(null);
        }}
        onCreated={handleChannelUpdated}
        editingChannel={editingChannel}
      />

      {/* Delete channel confirmation */}
      <AlertDialog open={!!deletingChannel} onOpenChange={(open) => { if (!open) setDeletingChannel(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deletingChannel?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deletingChannel?.type === "group" ? "group chat" : "channel"} and all its messages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChannel}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all chats confirmation */}
      <AlertDialog onOpenChange={setShowDeleteAllDialog} open={showDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              your chats and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
