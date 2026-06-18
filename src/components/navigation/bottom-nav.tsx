"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { id: "dashboard", label: "Inicio", href: "/dashboard", icon: Home },
  { id: "expenses", label: "Gastos", href: "/expenses", icon: CreditCard },
  { id: "history", label: "Historial", href: "/history", icon: CalendarDays },
  { id: "settings", label: "Config", href: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed right-0 bottom-0 left-0 z-50 lg:hidden"
      style={{
        background: "color-mix(in srgb, var(--bg-elevated) 92%, transparent)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-16 items-stretch">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              // "Config" fits the tab width; accessible name stays
              // "Configuración" to match the desktop sidebar nav.
              aria-label={item.id === "settings" ? "Configuración" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
                isActive
                  ? "text-(--accent)"
                  : "text-(--fg-3) hover:text-(--fg-1)",
              )}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <item.icon
                className={cn("size-5 shrink-0", isActive && "stroke-[2.2]")}
              />
              {item.label}
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  margin: "2px auto 0",
                  visibility: isActive ? "visible" : "hidden",
                }}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
