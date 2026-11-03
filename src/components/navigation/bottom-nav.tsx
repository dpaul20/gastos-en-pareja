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
  const activeIndex = items.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  return (
    <nav
      aria-label="Navegación principal"
      className="dock glass lg:hidden"
      style={
        {
          "--dock-index": Math.max(activeIndex, 0),
        } as React.CSSProperties
      }
    >
      <div className="relative flex h-16 items-stretch p-1.5">
        {activeIndex >= 0 && <span aria-hidden className="dock-pill" />}
        {items.map((item) => {
          const isActive = items[activeIndex]?.id === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              // "Config" fits the tab width; accessible name stays
              // "Configuración" to match the desktop sidebar nav.
              aria-label={item.id === "settings" ? "Configuración" : undefined}
              onClick={() => {
                if (!isActive && "vibrate" in navigator) navigator.vibrate(8);
              }}
              className={cn(
                "press relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] [font-family:var(--font-sans)] text-[10.5px] font-semibold transition-colors",
                isActive
                  ? "text-(--accent)"
                  : "text-(--fg-3) hover:text-(--fg-1)",
              )}
            >
              <item.icon
                aria-hidden
                className={cn(
                  "size-[22px] shrink-0 transition-transform duration-300 [transition-timing-function:var(--ease-spring)]",
                  isActive && "-translate-y-px scale-110 stroke-[2.2]",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
