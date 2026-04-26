import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Ingresá a Gastos en Pareja y gestioná los gastos del mes con tu pareja de forma proporcional a los ingresos.",
  robots: { index: true, follow: true }, // única ruta pública indexable
  openGraph: {
    title: "Gastos en Pareja — Iniciar sesión",
    description:
      "Gestioná los gastos del mes de forma proporcional a los ingresos de cada uno.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Gastos en Pareja",
  description:
    "Aplicación para gestionar y distribuir los gastos mensuales en pareja de forma proporcional a los ingresos.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web, Android, iOS",
  offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
