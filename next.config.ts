import type { NextConfig } from "next";

// Header di sicurezza per tutte le risposte del sito e delle API.
// Niente Content-Security-Policy completa: GA4, Adsterra e la mappa caricano
// risorse esterne e una policy rigida va prima provata in modalità
// report-only. Qui solo `frame-ancestors`, che non tocca gli script.
const securityHeaders = [
  // Il sito non va mai incorporato in pagine altrui (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La posizione serve solo a Rifornio stesso, mai a iframe di terze parti.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
