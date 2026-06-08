import { AppSidebar } from "@/components/navigation/sidebar-nav";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider className="bg-(--bg-base)">
      <AppSidebar />

      <SidebarInset className="bg-(--bg-base)">
        {/* Mobile header with hamburger — hidden on desktop */}
        <header className="flex items-center gap-2 border-b border-(--border-subtle) bg-(--bg-elevated) px-4 py-3 lg:hidden">
          <SidebarTrigger />
        </header>

        <div className="flex-1">
          <div className="mx-auto w-full max-w-97.5 md:mx-0 md:max-w-none">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
