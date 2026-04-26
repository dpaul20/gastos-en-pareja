import type { Metadata, Viewport } from "next";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gastos en Pareja",
  description:
    "Gestioná los gastos del mes de forma proporcional a los ingresos de cada uno.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gastos en Pareja",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "Gastos en Pareja",
    description: "Gestioná los gastos del mes de forma proporcional.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6C5CE7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
