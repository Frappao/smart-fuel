import AnalyticsConsent from "@/components/analytics/AnalyticsConsent";
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
  title: {
    default: "Rifornio — Fai rifornimento dove conviene davvero",
    template: "%s | Rifornio",
  },
  description:
    "Trova il distributore più conveniente considerando prezzo del carburante, distanza e consumo dell'auto.",
  keywords: [
    "prezzi benzina",
    "prezzo gasolio",
    "prezzi carburanti",
    "distributori economici",
    "distributori convenienti",
    "GPL",
    "consumo auto",
    "calcolo risparmio benzina",
    "MIMIT",
    "Rifornio",
  ],
  applicationName: "Rifornio",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Rifornio — Fai rifornimento dove conviene davvero",
    description: "Trova il distributore più conveniente considerando prezzo, distanza e consumo dell'auto.",
    url: "https://rifornio.it",
    siteName: "Rifornio",
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rifornio — Fai rifornimento dove conviene davvero",
    description: "Trova il distributore più conveniente considerando prezzo, distanza e consumo dell'auto.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://rifornio.it/#website",
      "url": "https://rifornio.it",
      "name": "Rifornio",
      "description":
        "Fai rifornimento dove conviene davvero. Trova il distributore più conveniente considerando prezzo, distanza e consumo dell'auto.",
      "inLanguage": "it-IT",
    },
    {
      "@type": "WebApplication",
      "@id": "https://rifornio.it/#app",
      "name": "Rifornio",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "All",
      "url": "https://rifornio.it",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
      },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
        <AnalyticsConsent />
      </body>
    </html>
  );
}
