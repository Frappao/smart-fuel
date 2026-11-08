import Link from "next/link";
import FuelSearchCalculator from "../components/calculation/FuelSearchCalculator";
import { ResultsMapProvider } from "../components/map/ResultsMapContext";
import { HomepageRightColumn } from "../components/map/StationsResultMap";
import { AppBetaButton, AppBetaProvider } from "../components/mobile-promo/AppBetaModal";
import SharedStationBanner from "../components/share/SharedStationBanner";
import HeroBrandBadge from "../components/hero/HeroBrandBadge";
import PriceUpdateNotice from "../components/hero/PriceUpdateNotice";
import { getLatestPriceUpdate } from "../lib/mimit/getLatestPriceUpdate";

import VehicleAccount, { AccountButton, RegistrationPrompt } from "../components/account/VehicleAccount";

// ISR: la data dell'ultimo aggiornamento prezzi viene riletta al massimo ogni ora.
export const revalidate = 3600;

export default async function Home() {
  const latestPriceUpdate = await getLatestPriceUpdate();

  return (
    <VehicleAccount>
    <AppBetaProvider>
    <ResultsMapProvider>
    <div className="relative flex min-h-screen flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Apple-style subtle ambient glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden md:block">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 h-[550px] w-[850px] rounded-full bg-emerald-500/10 blur-[140px]" />
      </div>

      <header className="relative md:sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950 md:bg-zinc-950/80 md:backdrop-blur-xl md:saturate-150">
        <nav aria-label="Navigazione principale" className="mx-auto flex flex-wrap md:flex-nowrap items-center justify-between w-full max-w-7xl px-3.5 sm:px-6 lg:px-8 py-2.5 md:py-0 md:h-20 gap-x-4 gap-y-2">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-emerald-400 transition hover:opacity-90">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm">
                ⛽
              </span>
              <span>Rifornio</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                BETA
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/prezzi-carburanti"
                className="text-sm font-medium text-zinc-400 transition hover:text-emerald-400"
              >
                Prezzi Carburanti
              </Link>
              <Link
                href="/come-funziona"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
              >
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Simulatore: come funziona
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <AppBetaButton />
            <AccountButton />
          </div>

          {/* Sub-row for navigation links on mobile (< md) */}
          <div className="flex md:hidden w-full items-center gap-4 border-t border-zinc-800/60 pt-2 pb-0.5 text-xs font-medium overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/prezzi-carburanti"
              className="whitespace-nowrap text-zinc-400 transition hover:text-emerald-400"
            >
              Prezzi Carburanti
            </Link>
            <Link
              href="/come-funziona"
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-emerald-400 transition hover:text-emerald-300"
            >
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Simulatore: come funziona
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 gap-8 sm:gap-10 px-4 py-5 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start lg:gap-12 lg:px-8 lg:py-8">
        <div
          aria-label="Calcolatore e risultati"
          role="region"
          tabIndex={0}
          className="min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          <div className="flex w-full flex-col gap-5 sm:gap-8">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-2.5 sm:space-y-4 max-w-xl">
                <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 shadow-xs">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Calcolo basato su litri netti e consumo reale</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl text-zinc-50">
                  Fai rifornimento{" "}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                    dove conviene davvero.
                  </span>
                </h1>
                <p className="text-sm leading-6 text-zinc-400 sm:hidden">
                  Prezzo, strada e consumo: vince il distributore che ti lascia più litri.
                </p>
                <p className="hidden sm:block text-base leading-7 text-zinc-400">
                  Trova il distributore più conveniente confrontando prezzo al litro,
                  distanza stradale effettiva e carburante consumato per il viaggio.
                </p>
                <PriceUpdateNotice latestCommunicatedAt={latestPriceUpdate} />
              </div>

              <div className="hidden sm:flex shrink-0">
                <HeroBrandBadge />
              </div>
            </header>
            <SharedStationBanner />
            <FuelSearchCalculator />
            <RegistrationPrompt />
          </div>
        </div>

        <HomepageRightColumn
          defaultGuide={
            <section
              aria-labelledby="homepage-guide-title"
              tabIndex={0}
              className="min-w-0 space-y-4 rounded-3xl border border-zinc-800/80 bg-zinc-900/50 lg:backdrop-blur-xl p-5 sm:p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 shadow-2xl lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-y-contain"
            >
          <div className="space-y-2.5">
            <p className="text-xs font-bold tracking-wider uppercase text-emerald-400">
              La guida alla convenienza
            </p>
            <h2
              className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl"
              id="homepage-guide-title"
            >
              Il prezzo più basso non è sempre la scelta migliore
            </h2>
            <p className="text-sm leading-6 text-zinc-400">
              Un distributore può offrire un prezzo al litro inferiore, ma
              richiedere una deviazione più lunga. Il carburante consumato per
              raggiungerlo può ridurre o annullare il risparmio ottenuto alla
              pompa.
            </p>
            <p className="text-sm leading-6 text-zinc-400">
              Per questo Rifornio confronta ciò che rimane realmente del
              rifornimento dopo aver stimato il carburante necessario per il
              viaggio.
            </p>
          </div>

          <details className="group rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 transition-all duration-200 hover:border-zinc-700">
            <summary className="flex cursor-pointer list-none items-center justify-between py-1 font-semibold text-zinc-200 hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400">
              <span>Come decide Rifornio</span>
              <span aria-hidden="true" className="text-emerald-400 transition-transform duration-200 group-open:rotate-180">▾</span>
            </summary>
            <div className="mt-4 space-y-3 pt-3 border-t border-zinc-800/60">
              <p className="text-xs leading-5 text-zinc-400">
                I prezzi della benzina utilizzati da Rifornio provengono dagli
                Open Data ufficiali del Ministero delle Imprese e del Made in
                Italy (MIMIT). A partire da questi dati, Rifornio:
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-xs leading-5 text-zinc-400">
                <li>individua i distributori vicini;</li>
                <li>
                  usa per i candidati la distanza stradale reale via Mapbox, non soltanto quella
                  in linea d&apos;aria;
                </li>
                <li>considera il consumo medio indicato dall&apos;utente;</li>
                <li>
                  confronta i litri acquistati con il carburante stimato per il
                  viaggio.
                </li>
              </ul>
              <p className="text-xs font-medium text-emerald-300">
                Il distributore consigliato è quello con il maggior numero di
                litri netti stimati.
              </p>
            </div>
          </details>

          <details className="group rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 transition-all duration-200 hover:border-zinc-700">
            <summary className="flex cursor-pointer list-none items-center justify-between py-1 font-semibold text-zinc-200 hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400">
              <span>Un esempio concreto</span>
              <span aria-hidden="true" className="text-emerald-400 transition-transform duration-200 group-open:rotate-180">▾</span>
            </summary>
            <div className="mt-4 space-y-4 pt-3 border-t border-zinc-800/60">
              <p className="text-xs leading-5 text-zinc-400">
                Questo esempio è puramente illustrativo e considera un
                rifornimento da 50 € e un consumo medio di 6 L/100 km.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-emerald-300">
                      Distributore A (Consigliato)
                    </p>
                    <span className="text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 px-2 py-0.5">
                      Vince A
                    </span>
                  </div>
                  <ul className="mt-2.5 space-y-1 text-xs leading-5 text-zinc-300 tabular-nums">
                    <li>Prezzo benzina: <span className="font-semibold text-zinc-100">1,80 €/L</span></li>
                    <li>Distanza A/R: 4 km</li>
                    <li>Litri acquistati: 27,78 L</li>
                    <li>Carburante viaggio: 0,24 L</li>
                    <li className="font-bold text-emerald-400 pt-1 border-t border-emerald-500/20">
                      Litri netti: circa 27,54 L
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="font-semibold text-zinc-300">
                    Distributore B (Più lontano)
                  </p>
                  <ul className="mt-2.5 space-y-1 text-xs leading-5 text-zinc-400 tabular-nums">
                    <li>Prezzo benzina: <span className="font-semibold text-zinc-200">1,76 €/L (-4¢)</span></li>
                    <li>Distanza A/R: 24 km</li>
                    <li>Litri acquistati: 28,41 L</li>
                    <li>Carburante viaggio: 1,44 L</li>
                    <li className="font-semibold text-zinc-300 pt-1 border-t border-zinc-800">
                      Litri netti: circa 26,97 L
                    </li>
                  </ul>
                </div>
              </div>

              <p className="text-xs leading-5 text-zinc-400">
                In questo caso il distributore A risulta più conveniente, anche
                se il prezzo al litro è maggiore, perché richiede molto meno
                carburante per essere raggiunto.
              </p>
            </div>
          </details>

          <details className="group rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 transition-all duration-200 hover:border-zinc-700">
            <summary className="flex cursor-pointer list-none items-center justify-between py-1 font-semibold text-zinc-200 hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400">
              <span>Dati, stime e trasparenza</span>
              <span aria-hidden="true" className="text-emerald-400 transition-transform duration-200 group-open:rotate-180">▾</span>
            </summary>
            <div className="mt-4 space-y-3 pt-3 border-t border-zinc-800/60">
              <p className="text-xs leading-5 text-zinc-400">
                I prezzi sono quelli comunicati attraverso gli Open Data MIMIT.
                Distanze e consumi sono stime: il consumo reale può cambiare in
                base al traffico, allo stile di guida, al percorso e alle
                condizioni dell&apos;auto.
              </p>
              <p className="text-xs leading-5 text-zinc-400">
                Rifornio è uno strumento di confronto e non garantisce che il
                prezzo sia identico a quello presente fisicamente alla pompa nel
                preciso momento dell&apos;arrivo.
              </p>
            </div>
          </details>
          <nav
            aria-label="Approfondimenti"
            className="flex flex-col items-start gap-2.5 border-t border-zinc-800/80 pt-4 text-xs leading-5 text-zinc-400"
          >
            <Link
              className="font-medium text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/prezzi-carburanti"
            >
              Consulta i prezzi dei carburanti per città
            </Link>
            <Link
              className="font-medium text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/come-funziona"
            >
              Simula e scopri come funziona Rifornio
            </Link>
            <Link
              className="font-medium text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/guide/distributore-piu-lontano"
            >
              Quando conviene davvero un distributore più lontano?
            </Link>
            <Link
              className="font-medium text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/guide/consumo-auto-convenienza"
            >
              Quanto incide il consumo dell&apos;auto sulla convenienza?
            </Link>
          </nav>
            </section>
          }
        />
      </main>

      <footer className="relative z-10 border-t border-zinc-900 bg-zinc-950/90">
        <div className="mx-auto w-full max-w-7xl space-y-2 px-4 py-8 text-xs leading-6 text-zinc-400 sm:px-6 lg:px-8">
          <p className="font-semibold text-zinc-300">
            Rifornio
          </p>
          <p>
            Dati su impianti e prezzi carburanti:{" "}
            <a
              className="font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti"
              rel="noopener noreferrer"
              target="_blank"
            >
              Ministero delle Imprese e del Made in Italy (MIMIT)
            </a>
            , licenza{" "}
            <a
              className="font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="https://www.dati.gov.it/content/italian-open-data-license-v20"
              rel="noopener noreferrer"
              target="_blank"
            >
              IODL 2.0
            </a>
            .
          </p>

          <p>Rifornio è un servizio indipendente e non è affiliato al MIMIT.</p>

          <nav
            aria-label="Informazioni e pagine utili"
            className="flex flex-wrap gap-x-4 gap-y-2 pt-2"
          >
            <Link
              className="font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/prezzi-carburanti"
            >
              Prezzi Carburanti
            </Link>

            <Link
              className="font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/come-funziona"
            >
              Simulatore: come funziona
            </Link>

            <Link
              className="font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/il-progetto"
            >
              Il progetto
            </Link>

            <Link
              className="font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/guide/distributore-piu-lontano"
            >
              Guida Distributore Lontano
            </Link>

            <Link
              className="font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/guide/consumo-auto-convenienza"
            >
              Guida Consumo Auto
            </Link>

            <Link
              className="font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/supporto"
            >
              Supporto
            </Link>

            <Link
              className="font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/privacy"
            >
              Privacy
            </Link>

            <Link
              className="font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-emerald-400"
              href="/cookie"
            >
              Cookie
            </Link>
          </nav>
        </div>
      </footer>
    </div>
    </ResultsMapProvider>
    </AppBetaProvider>
    </VehicleAccount>
  );
}
