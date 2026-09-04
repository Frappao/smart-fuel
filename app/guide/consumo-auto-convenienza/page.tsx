import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quanto incide il consumo dell'auto sulla convenienza? | Rifornio",
  description:
    "Scopri come il consumo medio dell'auto incide sul carburante necessario per raggiungere un distributore e sulla convenienza stimata.",
  alternates: {
    canonical: "/guide/consumo-auto-convenienza",
  },
};

const sectionClassName = "space-y-3";
const headingClassName =
  "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";
const linkClassName =
  "font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300";

export default function CarConsumptionGuidePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Quanto incide il consumo dell&apos;auto sulla convenienza del
          distributore?
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          Due automobilisti che confrontano gli stessi distributori possono
          ottenere risultati diversi se le loro auto hanno consumi medi
          differenti.
        </p>
      </header>

      <div className="mt-8 space-y-9 text-base leading-7 text-zinc-700 dark:text-zinc-300">
        <section className={sectionClassName}>
          <h2 className={headingClassName}>Perché il consumo cambia il risultato</h2>
          <p>
            Rifornio usa il consumo medio espresso in L/100 km per stimare
            quanto carburante serve per il viaggio di andata e ritorno verso
            ciascun distributore.
          </p>
          <p>
            A parità di prezzo, importo e distanza, un&apos;auto che consuma di più
            avrà meno litri netti disponibili dopo il viaggio.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Cosa significa L/100 km</h2>
          <p>
            Il valore indica quanti litri vengono consumati, in media, per
            percorrere 100 km:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>5 L/100 km significa circa 5 litri ogni 100 km;</li>
            <li>8 L/100 km significa circa 8 litri ogni 100 km.</li>
          </ul>
          <p>
            Sulla stessa distanza, un valore più alto corrisponde quindi a una
            maggiore quantità di carburante consumato.
          </p>
        </section>

        <section className="space-y-4">
          <div className="space-y-3">
            <h2 className={headingClassName}>Un esempio numerico</h2>
            <p>
              Consideriamo lo stesso distributore per due auto diverse. Il
              rifornimento è di 40 €, la benzina costa 1,78 €/L e la distanza di
              andata è di 8 km, per un viaggio stimato di andata e ritorno pari
              a 16 km.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Auto A
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6">
                <li>Consumo medio: 5 L/100 km</li>
                <li>Litri acquistati: circa 22,47 L</li>
                <li>Carburante per il viaggio: circa 0,80 L</li>
                <li className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Litri netti: circa 21,67 L
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Auto B
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6">
                <li>Consumo medio: 8 L/100 km</li>
                <li>Litri acquistati: circa 22,47 L</li>
                <li>Carburante per il viaggio: circa 1,28 L</li>
                <li className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Litri netti: circa 21,19 L
                </li>
              </ul>
            </div>
          </div>

          <p>
            I litri acquistati sono gli stessi perché non cambiano né il prezzo
            né l&apos;importo del rifornimento. Cambia invece il carburante stimato
            per il viaggio e, di conseguenza, il risultato netto.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Perché i distributori lontani vengono penalizzati di più
          </h2>
          <p>
            All&apos;aumentare del consumo medio cresce il costo, in termini di
            carburante, della distanza percorsa. Per un&apos;auto che consuma di più,
            una piccola differenza di prezzo può quindi essere annullata più
            facilmente da un tragitto lungo.
          </p>
          <p>
            Il risultato dipende comunque anche dall&apos;importo del rifornimento e
            dalla differenza effettiva tra i prezzi confrontati.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Il consumo reale può cambiare</h2>
          <p>
            Il valore inserito dall&apos;utente è una stima media. Traffico,
            velocità, temperatura, stile di guida, carico e condizioni del
            veicolo possono modificare il consumo reale durante il percorso.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Un confronto legato alla propria auto</h2>
          <p>
            Inserire un consumo medio realistico rende il confronto più utile.
            Non esiste un unico distributore migliore indipendentemente
            dall&apos;auto: la convenienza stimata cambia insieme alle caratteristiche
            del viaggio e del veicolo.
          </p>
        </section>

        <nav
          aria-label="Approfondimenti"
          className="flex flex-col items-start gap-3 border-t border-zinc-200 pt-8 sm:flex-row sm:flex-wrap sm:gap-6 dark:border-zinc-800"
        >
          <Link className={linkClassName} href="/">
            Calcola quale distributore conviene
          </Link>
          <Link
            className={linkClassName}
            href="/guide/distributore-piu-lontano"
          >
            Scopri quando conviene un distributore più lontano
          </Link>
          <Link className={linkClassName} href="/come-funziona">
            Scopri come funziona il calcolo
          </Link>
        </nav>
      </div>
    </main>
  );
}
