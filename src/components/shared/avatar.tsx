"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PersonAvatarProps {
  initials: string;
  person: "a" | "b";
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClass = {
  sm: "size-7",
  md: "size-9",
  lg: "size-12",
  xl: "size-[60px]",
};

const fontSizeStyle = { sm: 10, md: 13, lg: 17, xl: 22 };

export function PersonAvatar({
  initials,
  person,
  size = "md",
}: Readonly<PersonAvatarProps>) {
  const bg = person === "a" ? "var(--person-a)" : "var(--person-b)";

  return (
    <Avatar className={cn("shrink-0", sizeClass[size])}>
      <AvatarFallback
        style={{
          background: bg,
          color: "white",
          fontSize: fontSizeStyle[size],
          fontWeight: 700,
        }}
        aria-label={`Avatar de ${initials}`}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
