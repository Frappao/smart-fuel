import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rifornio.it"),
  title: "Rifornio",
  description:
    "Trova il distributore più conveniente considerando prezzo del carburante, distanza e consumo dell'auto.",
  applicationName: "Rifornio",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Rifornio",
    description: "Fai rifornimento dove conviene davvero.",
    url: "https://rifornio.it",
    siteName: "Rifornio",
    locale: "it_IT",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
