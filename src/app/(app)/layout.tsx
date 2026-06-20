import { AppSidebar } from "@/components/navigation/sidebar-nav";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppShell } from "./_components/app-shell";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider className="bg-(--bg-base)">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:contents">
        <AppSidebar />
      </div>

      <SidebarInset className="bg-(--bg-base)">
        <div className="flex-1 pb-16 lg:pb-0">
          <div className="mx-auto w-full max-w-97.5 md:mx-0 md:max-w-none">
            <AppShell>{children}</AppShell>
          </div>
        </div>
      </SidebarInset>

      {/* Mobile bottom nav — hidden on desktop */}
      <BottomNav />
    </SidebarProvider>
  );
}
