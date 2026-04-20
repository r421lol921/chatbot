import { Suspense } from "react";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WebLLMProvider } from "@/hooks/use-webllm";
import { auth } from "@/app/(auth)/auth";

async function ChannelSidebar() {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user as any} userType={session?.user?.type} />
    </SidebarProvider>
  );
}

export default function ChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WebLLMProvider>
      <Toaster
        position="top-center"
        theme="system"
        toastOptions={{
          className:
            "!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
        }}
      />
      <Suspense fallback={null}>
        <ChannelSidebarWrapper>{children}</ChannelSidebarWrapper>
      </Suspense>
    </WebLLMProvider>
  );
}

async function ChannelSidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user as any} userType={session?.user?.type} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
