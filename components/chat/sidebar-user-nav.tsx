"use client";

import { ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
type User = { id?: string; email?: string | null; name?: string | null; image?: string | null };
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import type { UserType } from "@/app/(auth)/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { guestRegex } from "@/lib/constants";

function emailToHue(email: string): number {
  let hash = 0;
  for (const char of email) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function UserTypeBadge({ userType, resolvedTheme }: { userType: UserType; resolvedTheme?: string }) {
  const isPlus = userType === "plus";
  const isDark = resolvedTheme === "dark";

  if (isPlus) {
    return (
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide leading-none"
        style={
          isDark
            ? { background: "#fff", color: "#000" }
            : { background: "#000", color: "#fff" }
        }
      >
        Plus
      </span>
    );
  }

  return (
    <span
      className="shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide leading-none text-muted-foreground border-border/60"
    >
      Basic
    </span>
  );
}

export function SidebarUserNav({ user, userType: userTypeProp }: { user: User; userType?: UserType }) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const userType: UserType = userTypeProp ?? "regular";

  const isGuest = guestRegex.test(user?.email ?? "");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {(
              <SidebarMenuButton
                className="h-8 px-2 rounded-lg bg-transparent text-sidebar-foreground/70 transition-colors duration-150 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
              >
                <div
                  className="size-5 shrink-0 rounded-full ring-1 ring-sidebar-border/50"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.35 0.08 ${emailToHue(user.email ?? "")}), oklch(0.25 0.05 ${emailToHue(user.email ?? "") + 40}))`,
                  }}
                />
                <span className="truncate text-[13px]" data-testid="user-email">
                  {isGuest ? "Guest" : user?.email}
                </span>
                {!isGuest && (
                  <UserTypeBadge resolvedTheme={resolvedTheme} userType={userType} />
                )}
                <ChevronUp className="ml-auto size-3.5 text-sidebar-foreground/50" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width) rounded-lg border border-border/60 bg-card/95 backdrop-blur-xl shadow-[var(--shadow-float)]"
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer text-[13px]"
              data-testid="user-nav-item-theme"
              onSelect={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                className="w-full cursor-pointer text-[13px]"
                onClick={async () => {
                  if (isGuest) {
                    router.push("/register");
                  } else {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    router.push("/login");
                    router.refresh();
                  }
                }}
                type="button"
              >
                {isGuest ? "Sign up for free" : "Sign out"}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
