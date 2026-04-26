"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    id: "dashboard",
    label: "Inicio",
    href: "/dashboard",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "expenses",
    label: "Gastos",
    href: "/expenses",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "Historial",
    href: "/history",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Config",
    href: "/settings",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--bottom-nav-height)",
        background: "rgba(247,247,248,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "flex-start",
        paddingTop: 6,
        zIndex: 100,
        maxWidth: 390,
        margin: "0 auto",
      }}
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              textDecoration: "none",
              padding: "4px 0",
              minHeight: 44,
              color: isActive ? "var(--accent)" : "var(--fg-3)",
            }}
          >
            {item.icon}
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 500,
                fontFamily: "var(--font-sans)",
              }}
            >
              {item.label}
            </span>
            {isActive && (
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 9999,
                  background: "var(--accent)",
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
