"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  captureCampaign,
  forgetStoredCampaign,
  persistCampaign,
  withCampaign,
} from "../../lib/analytics/campaign";
import {
  deleteGoogleAnalyticsCookies,
  getStoredConsent,
  saveConsent,
  subscribeToConsent,
} from "../../lib/analytics/consent";

export { CONSENT_EVENT, CONSENT_KEY } from "../../lib/analytics/consent";

const GA_MEASUREMENT_ID = "G-0323M57ZQP";
const GA_SCRIPT_ID = "rifornio-ga4";
// Interruttore ufficiale di gtag.js per fermare la raccolta su questa pagina.
const GA_DISABLE_FLAG = `ga-disable-${GA_MEASUREMENT_ID}`;

function setGoogleAnalyticsDisabled(disabled: boolean) {
  (window as unknown as Record<string, unknown>)[GA_DISABLE_FLAG] = disabled;
}

function loadGoogleAnalytics() {
  if (typeof window === "undefined") {
    return;
  }

  setGoogleAnalyticsDisabled(false);

  if (document.getElementById(GA_SCRIPT_ID)) {
    // Già caricato in questa pagina e poi revocato: riprende la raccolta.
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    return;
  }

  window.dataLayer = window.dataLayer || [];

  window.gtag = function gtag() {
    // Google gtag.js richiede l'oggetto arguments nel dataLayer.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  window.gtag("js", new Date());

  window.gtag("config", GA_MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    // Se il consenso arriva dopo un cambio di pagina, l'URL non ha più gli
    // utm_* del link di arrivo: li rimettiamo perché GA4 attribuisca la
    // sessione al canale giusto.
    page_location: withCampaign(window.location.href),
  });

  const script = document.createElement("script");

  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

  document.head.appendChild(script);
}

function stopGoogleAnalytics() {
  setGoogleAnalyticsDisabled(true);
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
  deleteGoogleAnalyticsCookies();
}

export default function AnalyticsConsent() {
  const consent = useSyncExternalStore(
    subscribeToConsent,
    getStoredConsent,
    () => null,
  );
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const previousConsentRef = useRef(consent);

  // Canale della visita, letto subito dall'URL di arrivo.
  useEffect(() => {
    captureCampaign(window.location.href, getStoredConsent() === "granted");
  }, []);

  useEffect(() => {
    if (consent === "granted") {
      persistCampaign();
      loadGoogleAnalytics();
    } else {
      stopGoogleAnalytics();
      if (consent === "denied") forgetStoredCampaign();
    }

    // Banner riaperto da "Preferenze cookie": il focus va sulla scelta.
    if (consent === null && previousConsentRef.current !== null) {
      acceptButtonRef.current?.focus();
    }
    previousConsentRef.current = consent;
  }, [consent]);

  if (consent !== null) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Preferenze Analytics"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-2xl transition-all md:bg-white/90 md:backdrop-blur-xl md:saturate-150 dark:border-zinc-700/80 dark:bg-zinc-900 md:dark:bg-zinc-900/90"
    >
      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Analytics
      </p>

      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        Vorremmo usare Google Analytics per capire quante persone utilizzano
        Rifornio, da dove arrivano e migliorare il servizio. Puoi accettare o
        continuare senza Analytics, e cambiare idea quando vuoi da
        &ldquo;Preferenze cookie&rdquo;. Dettagli nella{" "}
        <Link
          className="font-medium underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300"
          href="/cookie"
        >
          cookie policy
        </Link>
        .
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          ref={acceptButtonRef}
          type="button"
          onClick={() => saveConsent("granted")}
          className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white shadow-sm transition active:scale-[0.98] hover:bg-emerald-700"
        >
          Accetta Analytics
        </button>

        <button
          type="button"
          onClick={() => saveConsent("denied")}
          className="min-h-12 flex-1 rounded-xl border border-zinc-300 px-4 py-3 font-medium text-zinc-800 transition active:scale-[0.98] hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Continua senza Analytics
        </button>
      </div>
    </div>
  );
}
