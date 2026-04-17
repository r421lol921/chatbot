import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { ChatMessagesSkeleton } from "@/components/chat/chat-skeleton";
import { DataStreamProvider } from "@/components/chat/data-stream-provider";
import { ChatShell } from "@/components/chat/shell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ActiveChatProvider } from "@/hooks/use-active-chat";
import { WebLLMProvider } from "@/hooks/use-webllm";
import { auth } from "../(auth)/auth";

function ChatLayoutSkeleton() {
  return (
    <div className="flex h-dvh bg-sidebar">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-64 flex-col gap-3 bg-sidebar p-4">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-muted/60" />
        <div className="mt-2 flex flex-col gap-1.5">
          {[44, 68, 52, 35, 60, 48].map((w) => (
            <div key={w} className="h-7 animate-pulse rounded-lg bg-muted/40" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      {/* Main area skeleton */}
      <div className="flex flex-1 flex-col bg-background rounded-l-none md:rounded-l-2xl overflow-hidden">
        <div className="h-14 w-full animate-pulse bg-sidebar" />
        <div className="flex-1 overflow-hidden">
          <ChatMessagesSkeleton />
        </div>
        <div className="h-28 mx-auto w-full max-w-4xl px-4 pb-4">
          <div className="h-full w-full animate-pulse rounded-2xl bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="lazyOnload"
      />
      <WebLLMProvider>
        <DataStreamProvider>
          <Suspense fallback={<ChatLayoutSkeleton />}>
            <SidebarShell>{children}</SidebarShell>
          </Suspense>
        </DataStreamProvider>
      </WebLLMProvider>
    </>
  );
}

async function SidebarShell({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user as any} userType={session?.user?.type} />
      <SidebarInset>
        <Toaster
          position="top-center"
          theme="system"
          toastOptions={{
            className:
              "!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
          }}
        />
        <Suspense fallback={<div className="flex h-dvh" />}>
          <ActiveChatProvider>
            <ChatShell />
          </ActiveChatProvider>
        </Suspense>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
