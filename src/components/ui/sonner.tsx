"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      mobileOffset={{
        top: "calc(env(safe-area-inset-top) + 10px)",
        left: 12,
        right: 12,
      }}
      visibleToasts={3}
      gap={10}
      icons={{
        success: <CircleCheckIcon className="size-[18px]" />,
        info: <InfoIcon className="size-[18px]" />,
        warning: <TriangleAlertIcon className="size-[18px]" />,
        error: <OctagonXIcon className="size-[18px]" />,
        loading: <Loader2Icon className="size-[18px] animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "fx-toast",
          title: "fx-toast-title",
          description: "fx-toast-description",
          icon: "fx-toast-icon",
          actionButton: "fx-toast-action",
          cancelButton: "fx-toast-cancel",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
