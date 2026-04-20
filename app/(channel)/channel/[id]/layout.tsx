import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WebLLMProvider } from "@/hooks/use-webllm";
import { auth } from "@/app/(auth)/auth";

// Mark this route group as always dynamic so Next.js
// knows upfront that cookies()/auth() will be used — this
// satisfies the "uncached data outside Suspense" requirement.
export const dynamic = "force-dynamic";

export default async function ChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

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
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user as any} userType={session?.user?.type} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </WebLLMProvider>
  );
}
