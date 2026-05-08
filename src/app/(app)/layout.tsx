import { BottomNav } from "@/components/navigation/bottom-nav";
import { AppSidebar } from "@/components/navigation/sidebar-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider className="bg-(--bg-base)">
      {/* Desktop sidebar */}
      <AppSidebar />

      {/* Main content inset */}
      <SidebarInset className="bg-(--bg-base)">
        <main className="flex-1 overflow-y-auto pb-(--bottom-nav-height) lg:pb-0">
          {/* Mobile: 390px centered / Desktop: fills the inset */}
          <div className="mx-auto w-full max-w-97.5 lg:mx-0 lg:max-w-none">
            {children}
          </div>
        </main>

        {/* Bottom nav — mobile only */}
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
