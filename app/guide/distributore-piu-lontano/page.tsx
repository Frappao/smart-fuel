import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quando conviene davvero un distributore più lontano? | Rifornio",
  description:
    "Scopri come prezzo, distanza, importo del rifornimento e consumo dell'auto determinano se conviene raggiungere un distributore più lontano.",
  alternates: {
    canonical: "/guide/distributore-piu-lontano",
  },
};

const sectionClassName = "space-y-3";
const headingClassName =
  "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";
const linkClassName =
  "font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300";

export default function FartherStationGuidePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Quando conviene davvero un distributore più lontano?
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          Vedere un prezzo più basso non significa automaticamente risparmiare.
          Per confrontare due distributori bisogna considerare anche il
          carburante necessario per raggiungerli.
        </p>
      </header>

      <div className="mt-8 space-y-9 text-base leading-7 text-zinc-700 dark:text-zinc-300">
        <section className={sectionClassName}>
          <h2 className={headingClassName}>Il prezzo è solo una parte del confronto</h2>
          <p>
            Un distributore lontano può offrire benzina a un prezzo più basso,
            ma la strada aggiuntiva richiede carburante. Se il consumo del
            viaggio supera il vantaggio ottenuto alla pompa, raggiungerlo non è
            la scelta più conveniente.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Gli elementi che fanno la differenza</h2>
          <p>Il risultato dipende dalla combinazione di quattro fattori:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>la differenza di prezzo al litro;</li>
            <li>l&apos;importo complessivo del rifornimento;</li>
            <li>la distanza aggiuntiva da percorrere;</li>
            <li>il consumo medio dell&apos;auto.</li>
          </ul>
          <p>
            Nessuno di questi valori, preso singolarmente, basta a stabilire
            quale distributore conviene raggiungere.
          </p>
        </section>

        <section className="space-y-4">
          <div className="space-y-3">
            <h2 className={headingClassName}>Un esempio numerico</h2>
            <p>
              Consideriamo un esempio illustrativo con un rifornimento da 30 €
              e un&apos;auto che consuma in media 6 L/100 km.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Distributore vicino
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6">
                <li>Prezzo: 1,82 €/L</li>
                <li>Distanza di andata: 2 km</li>
                <li>Viaggio stimato andata/ritorno: 4 km</li>
                <li>Litri acquistati: circa 16,48 L</li>
                <li>Carburante per il viaggio: circa 0,24 L</li>
                <li className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Litri netti: circa 16,24 L
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Distributore più lontano
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6">
                <li>Prezzo: 1,75 €/L</li>
                <li>Distanza di andata: 10 km</li>
                <li>Viaggio stimato andata/ritorno: 20 km</li>
                <li>Litri acquistati: circa 17,14 L</li>
                <li>Carburante per il viaggio: circa 1,20 L</li>
                <li className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Litri netti: circa 15,94 L
                </li>
              </ul>
            </div>
          </div>

          <p>
            In questo esempio conviene il distributore vicino. Quello più
            lontano permette di acquistare più litri alla pompa, ma il maggiore
            consumo necessario per il viaggio porta a un risultato netto
            inferiore.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Perché l&apos;importo conta</h2>
          <p>
            Con un piccolo rifornimento, il vantaggio prodotto da pochi
            centesimi di differenza al litro può essere limitato, mentre il
            carburante usato per una deviazione lunga continua a pesare sul
            risultato.
          </p>
          <p>
            Con importi più elevati, invece, la differenza di prezzo può avere
            un&apos;incidenza maggiore. Questo non rende automaticamente conveniente
            il distributore lontano: distanza e consumo restano parte del
            confronto.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Perché il consumo dell&apos;auto conta
          </h2>
          <p>
            Un&apos;auto che consuma di più utilizza più carburante per coprire la
            stessa distanza. Di conseguenza, nel confronto vengono penalizzati
            maggiormente i distributori che richiedono un tragitto più lungo.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Non esiste una distanza giusta per tutti</h2>
          <p>
            Non c&apos;è una distanza oltre la quale un distributore smette sempre
            di essere conveniente. La risposta dipende dalla combinazione tra
            prezzo, importo del rifornimento, distanza stradale e consumo medio
            dell&apos;auto.
          </p>
        </section>

        <nav
          aria-label="Approfondimenti"
          className="flex flex-col items-start gap-3 border-t border-zinc-200 pt-8 sm:flex-row sm:gap-6 dark:border-zinc-800"
        >
          <Link className={linkClassName} href="/">
            Calcola quale distributore conviene
          </Link>
          <Link className={linkClassName} href="/come-funziona">
            Scopri come funziona il calcolo
          </Link>
        </nav>
      </div>
    </main>
  );
}
