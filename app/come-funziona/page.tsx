import type { Metadata } from "next";
import Link from "next/link";
import ConvenienceSimulatorSection from "../../components/3d/ConvenienceSimulatorSection";
import FuelTankComparisonSection from "../../components/3d/FuelTankComparisonSection";

export const metadata: Metadata = {
  title: "Simulatore di Convenienza — Come funziona | Rifornio",
  description:
    "Simula e scopri come Rifornio calcola il distributore più conveniente considerando prezzo del carburante, deviazione stradale e consumo dell'auto.",
  alternates: {
    canonical: "/come-funziona",
  },
};

const sectionClassName = "space-y-3";
const headingClassName =
  "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";

export default function HowItWorksPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        className="text-sm font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-300"
        href="/"
      >
        ← Torna a Rifornio
      </Link>

      <header className="mt-8 space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          Simulatore Interattivo
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Simulatore di Convenienza: come funziona
        </h1>
        <p className="max-w-3xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-300">
          Un distributore economico ma lontano consuma carburante per il solo tragitto.
          Rifornio calcola per te esattamente quale stazione ti lascia più litri netti nel serbatoio.
        </p>
      </header>

      {/* Main 3D Interactive Simulator */}
      <section className="my-8">
        <ConvenienceSimulatorSection />
      </section>

      <div className="mt-12 space-y-12 text-base leading-7 text-zinc-700 dark:text-zinc-300">
        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Il prezzo più basso non è sempre il più conveniente
          </h2>
          <p>
            Un distributore può avere un prezzo al litro inferiore ma trovarsi a
            diversi chilometri di distanza. Per raggiungerlo devi consumare carburante:
            parte del risparmio ottenuto alla pompa viene quindi annullato dal costo
            del viaggio di andata e ritorno.
          </p>
          <p>
            Nel simulatore qui sopra puoi notare come aumentando la distanza o il consumo
            dell&apos;auto, il distributore con il prezzo apparentemente migliore diventi
            in realtà perdente rispetto a una stazione vicina.
          </p>
        </section>

        {/* 3D Tank Visualizer Comparison */}
        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Cosa entra davvero nel serbatoio (Litri Netti)
          </h2>
          <p>
            Per rendere tangibile la differenza, confrontiamo due rifornimenti tipici:
          </p>
          <div className="pt-2">
            <FuelTankComparisonSection />
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Come viene calcolata la convenienza</h2>
          <p>Quando avvii il calcolo su Rifornio, consideriamo:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>il tipo di carburante selezionato (Benzina, Gasolio, GPL);</li>
            <li>la modalità Self o Servito;</li>
            <li>l&apos;importo in euro che intendi spendere;</li>
            <li>il consumo medio reale della tua auto;</li>
            <li>la posizione di partenza (attuale o indirizzo scelto);</li>
            <li>il prezzo ufficiale praticato dai distributori;</li>
            <li>la reale distanza stradale necessaria per raggiungerli.</li>
          </ul>
          <p>
            Per ogni distributore viene stimato quanto carburante puoi
            acquistare con l&apos;importo indicato e quanto carburante consumeresti
            per il viaggio di andata e ritorno.
          </p>
          <p>Il risultato viene ordinato rigorosamente in base ai litri netti:</p>
          <p>
            <code className="rounded bg-zinc-100 px-2.5 py-1.5 font-mono text-sm font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              litri acquistati − carburante stimato per il viaggio
            </code>
          </p>
          <p>La stazione con il valore più alto di litri netti è quella vincente.</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Ricerca lungo un percorso</h2>
          <p>
            Puoi usare la posizione attuale come partenza oppure pianificare una rotta
            da un punto A a un punto B (ad esempio prima di un lungo viaggio in autostrada).
          </p>
          <p>
            In questo caso Rifornio individua i distributori in un corridoio
            vicino al tragitto e calcola la sola deviazione stradale aggiuntiva necessaria per
            passare da ciascun impianto. Dal rifornimento viene sottratto il solo
            carburante per la deviazione, non per i chilometri che avresti comunque percorso.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Distanze stradali, non in linea d&apos;aria
          </h2>
          <p>
            Molte app filtrano i distributori semplicemente con un raggio circolare
            in linea d&apos;aria. Rifornio calcola le effettive matrici di percorrenza
            stradale (tramite Mapbox routing server-side) tenendo conto di svincoli, sensi unici
            e percorsi reali.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Self e Servito</h2>
          <p>I prezzi Self e Servito vengono trattati in modo strettamente separato.</p>
          <p>
            Se scegli Self, Rifornio confronta esclusivamente i prezzi comunicati per
            la modalità Self. Se scegli Servito, il confronto avviene solo sui prezzi Servito.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Origine dei dati e aggiornamento</h2>
          <p>
            I dati degli impianti e dei prezzi provengono quotidianamente dai dataset
            ufficiali del Ministero delle Imprese e del Made in Italy (MIMIT).
            Rifornio aggiorna automaticamente i listini ogni mattina tramite un processo certificato.
          </p>
        </section>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-zinc-950"
          >
            Avvia il calcolo per la tua auto
          </Link>
        </div>
      </div>
    </main>
  );
}
