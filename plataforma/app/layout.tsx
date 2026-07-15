import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RutaFHIR — aprende FHIR paso a paso",
    template: "%s · RutaFHIR",
  },
  description:
    "Plataforma de aprendizaje adaptativo de HL7 FHIR: lecturas en el celular, practica en la PC, tutor con IA y repaso espaciado.",
  appleWebApp: {
    capable: true,
    title: "RutaFHIR",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e2e6e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
