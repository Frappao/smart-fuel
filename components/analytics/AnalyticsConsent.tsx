"use client";

import { useEffect, useSyncExternalStore } from "react";

const CONSENT_KEY = "rifornio-analytics-consent";
const CONSENT_EVENT = "rifornio-analytics-consent-change";

const GA_MEASUREMENT_ID = "G-0323M57ZQP";
const GA_SCRIPT_ID = "rifornio-ga4";

type ConsentValue = "granted" | "denied";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(CONSENT_KEY);

  if (value === "granted" || value === "denied") {
    return value;
  }

  return null;
}

function subscribeToConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_EVENT, callback);
  };
}

function loadGoogleAnalytics() {
  if (typeof window === "undefined") {
    return;
  }

  if (document.getElementById(GA_SCRIPT_ID)) {
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
  });

  const script = document.createElement("script");

  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

  document.head.appendChild(script);
}

function saveConsent(value: ConsentValue) {
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export default function AnalyticsConsent() {
  const consent = useSyncExternalStore(
    subscribeToConsent,
    getStoredConsent,
    () => null,
  );

  useEffect(() => {
    if (consent === "granted") {
      loadGoogleAnalytics();
    }
  }, [consent]);

  if (consent !== null) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Preferenze Analytics"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
    >
      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Analytics
      </p>

      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        Vorremmo usare Google Analytics per capire quante persone utilizzano
        Rifornio e migliorare il servizio. Puoi accettare o continuare senza
        Analytics.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => saveConsent("granted")}
          className="min-h-12 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700"
        >
          Accetta Analytics
        </button>

        <button
          type="button"
          onClick={() => saveConsent("denied")}
          className="min-h-12 rounded-xl border border-zinc-300 px-4 py-3 font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Continua senza Analytics
        </button>
      </div>
    </div>
  );
}