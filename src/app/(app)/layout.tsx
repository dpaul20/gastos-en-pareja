import { BottomNav } from "@/components/navigation/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 390,
        margin: "0 auto",
        minHeight: "100dvh",
        position: "relative",
        background: "var(--bg-base)",
      }}
    >
      <main style={{ paddingBottom: "var(--bottom-nav-height)" }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
