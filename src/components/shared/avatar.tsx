"use client";

interface AvatarProps {
  initials: string;
  person: "a" | "b";
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = { sm: 28, md: 36, lg: 48, xl: 60 };
const fonts = { sm: 10, md: 13, lg: 17, xl: 22 };

export function Avatar({ initials, person, size = "md" }: AvatarProps) {
  const px = sizes[size];
  const fs = fonts[size];
  const bg = person === "a" ? "var(--person-a)" : "var(--person-b)";

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: 9999,
        background: bg,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: fs,
        flexShrink: 0,
        fontFamily: "var(--font-sans)",
      }}
    >
      {initials}
    </div>
  );
}
