"use client";

import type { ReactNode } from "react";

import { reopenConsentChoice } from "../../lib/analytics/consent";

/** Riapre il banner: l'utente può revocare o dare il consenso in ogni momento. */
export default function CookiePreferencesButton({
  className,
  children = "Preferenze cookie",
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={reopenConsentChoice}>
      {children}
    </button>
  );
}
