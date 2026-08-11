import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Come funziona | Rifornio",
  description:
    "Scopri come Rifornio calcola il distributore più conveniente considerando prezzo del carburante, distanza stradale e consumo.",
  alternates: {
    canonical: "/come-funziona",
  },
};

const sectionClassName = "space-y-3";
const headingClassName =
  "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";

export default function HowItWorksPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        className="text-sm font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-300"
        href="/"
      >
        Torna a Rifornio
      </Link>

      <header className="mt-8 space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Come funziona Rifornio
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          Rifornio ti aiuta a trovare il distributore più conveniente
          considerando non solo il prezzo del carburante, ma anche la distanza
          da percorrere e il consumo della tua auto.
        </p>
      </header>

      <div className="mt-8 space-y-9 text-base leading-7 text-zinc-700 dark:text-zinc-300">
        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Il prezzo più basso non è sempre il più conveniente
          </h2>
          <p>
            Un distributore può avere un prezzo al litro più basso ma trovarsi
            molto più lontano. Per raggiungerlo devi consumare carburante,
            quindi parte del risparmio ottenuto alla pompa può essere annullato
            dal viaggio.
          </p>
          <p>Rifornio prova a tenere conto proprio di questo.</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Come viene calcolata la convenienza</h2>
          <p>Quando avvii il calcolo, Rifornio considera:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>il tipo di carburante selezionato;</li>
            <li>la modalità Self o Servito;</li>
            <li>l&apos;importo che vuoi spendere;</li>
            <li>il consumo medio della tua auto;</li>
            <li>la tua posizione;</li>
            <li>il prezzo praticato dai distributori vicini;</li>
            <li>la distanza stradale necessaria per raggiungerli.</li>
          </ul>
          <p>
            Per ogni distributore viene stimato quanto carburante puoi
            acquistare con l&apos;importo indicato e quanto carburante consumeresti
            per il viaggio di andata e ritorno.
          </p>
          <p>Il risultato viene espresso in litri netti:</p>
          <p>
            <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              litri acquistati − carburante stimato per il viaggio
            </code>
          </p>
          <p>Più alto è questo valore, maggiore è la convenienza stimata.</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Un esempio semplice</h2>
          <p>Immagina due distributori.</p>
          <p>
            Il primo costa meno al litro, ma si trova molto lontano. Il secondo
            costa leggermente di più, ma è molto vicino.
          </p>
          <p>
            Se il carburante consumato per raggiungere il primo distributore
            supera il risparmio ottenuto sul prezzo, Rifornio può indicare il
            secondo come scelta più conveniente.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Distanze stradali, non in linea d&apos;aria
          </h2>
          <p>
            Rifornio utilizza inizialmente la distanza geografica per individuare
            i distributori nella zona, ma il confronto finale utilizza la
            distanza stradale stimata.
          </p>
          <p>
            In questo modo una stazione apparentemente vicina sulla mappa non
            viene considerata automaticamente conveniente se per raggiungerla è
            necessario percorrere molti chilometri.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Self e Servito</h2>
          <p>I prezzi Self e Servito vengono trattati separatamente.</p>
          <p>
            Se scegli Self, Rifornio confronta i prezzi disponibili per il
            rifornimento Self. Se scegli Servito, utilizza invece i prezzi
            relativi al servizio Servito.
          </p>
          <p>Lo stesso vale per il tipo di carburante selezionato.</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Da dove arrivano i prezzi</h2>
          <p>
            I dati relativi agli impianti e ai prezzi dei carburanti provengono
            dai dataset pubblici del Ministero delle Imprese e del Made in Italy
            (MIMIT).
          </p>
          <p>
            Rifornio elabora questi dati per aiutarti a confrontare i
            distributori, ma è un servizio indipendente e non è affiliato al
            MIMIT.
          </p>
          <p>
            I prezzi possono essere stati comunicati in momenti differenti dai
            gestori e possono quindi non coincidere sempre con il prezzo
            presente alla pompa nel momento esatto in cui utilizzi Rifornio.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Come viene scelta la classifica</h2>
          <p>
            Il distributore mostrato come più conveniente viene scelto
            esclusivamente sulla base del calcolo di convenienza di Rifornio.
          </p>
          <p>
            Eventuali contenuti pubblicitari presenti sul sito sono separati
            dalla classifica e non modificano l&apos;ordine dei risultati, il calcolo
            dei litri netti o il distributore indicato come vincitore.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>La posizione</h2>
          <p>
            La posizione serve per individuare i distributori vicini e calcolare
            le distanze. Rifornio richiede l&apos;accesso alla posizione soltanto
            quando avvii il calcolo tramite il browser.
          </p>
          <p>
            Per maggiori informazioni consulta la pagina{" "}
            <Link
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300"
              href="/privacy"
            >
              Privacy
            </Link>
            .
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Una stima, non una garanzia</h2>
          <p>
            I risultati di Rifornio sono stime basate sui dati disponibili,
            sulla distanza stradale e sul consumo medio indicato dall&apos;utente.
          </p>
          <p>
            Consumo reale, traffico, deviazioni, prezzi aggiornati alla pompa e
            altri fattori possono modificare il risultato effettivo.
          </p>
          <p>
            Rifornio vuole quindi essere uno strumento di supporto alla scelta,
            non una garanzia del risparmio finale.
          </p>
        </section>
      </div>
    </main>
  );
}
