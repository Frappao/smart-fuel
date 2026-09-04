import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Il progetto | Rifornio",
  description:
    "Scopri perché nasce Rifornio, quali dati utilizza e quali criteri considera per confrontare i distributori di benzina.",
  alternates: {
    canonical: "/il-progetto",
  },
};

const sectionClassName = "space-y-3";
const headingClassName =
  "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";
const linkClassName =
  "font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300";

export default function ProjectPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Il progetto
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          Rifornio nasce per aiutare chi deve fare rifornimento a confrontare le
          alternative disponibili con un criterio più completo del solo prezzo
          esposto al litro.
        </p>
      </header>

      <div className="mt-8 space-y-9 text-base leading-7 text-zinc-700 dark:text-zinc-300">
        <section className={sectionClassName}>
          <h2 className={headingClassName}>Una domanda pratica</h2>
          <p>
            Il punto di partenza è semplice: «Quale distributore conviene
            davvero raggiungere?»
          </p>
          <p>
            Il prezzo al litro, da solo, non basta a rispondere. Per raggiungere
            un distributore più lontano è necessario consumare carburante e
            quella spesa può ridurre il vantaggio di un prezzo più basso.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Come funziona l&apos;idea</h2>
          <p>Rifornio combina alcuni elementi utili al confronto:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>la posizione dell&apos;utente;</li>
            <li>i distributori vicini;</li>
            <li>i prezzi ufficiali della Benzina Self Service;</li>
            <li>la distanza stradale;</li>
            <li>il consumo medio dell&apos;auto indicato dall&apos;utente.</li>
          </ul>
          <p>
            Con questi dati stima quanti litri restano effettivamente del
            rifornimento dopo aver considerato il carburante necessario per il
            viaggio stimato di andata e ritorno.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Fonti dei dati</h2>
          <p>
            I prezzi utilizzati provengono dagli Open Data ufficiali del
            Ministero delle Imprese e del Made in Italy (MIMIT). Rifornio non
            modifica né inventa i prezzi comunicati attraverso questi dataset.
          </p>
          <p>
            Tra la comunicazione ufficiale e l&apos;arrivo dell&apos;utente alla pompa,
            tuttavia, un prezzo può cambiare. Il valore mostrato deve quindi
            essere considerato nel contesto del momento in cui è stato
            comunicato.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Indipendenza della classifica</h2>
          <p>
            L&apos;ordine dei distributori è determinato dal calcolo di convenienza
            basato sui dati disponibili e sui valori indicati dall&apos;utente.
          </p>
          <p>
            Eventuali contenuti pubblicitari sono separati dalla classifica:
            non ne modificano l&apos;ordine e Rifornio non favorisce distributori in
            base alla pubblicità.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Limiti del confronto</h2>
          <p>
            Distanza e consumo sono stime. Traffico, stile di guida, percorso e
            condizioni del veicolo possono incidere sul carburante realmente
            utilizzato.
          </p>
          <p>
            Il risultato offerto da Rifornio è uno strumento di confronto, non
            una garanzia assoluta di risparmio.
          </p>
        </section>

        <nav
          aria-label="Approfondimenti sul progetto"
          className="flex flex-col items-start gap-3 border-t border-zinc-200 pt-8 sm:flex-row sm:gap-6 dark:border-zinc-800"
        >
          <Link className={linkClassName} href="/">
            Torna al calcolatore
          </Link>
          <Link className={linkClassName} href="/come-funziona">
            Scopri come viene calcolata la convenienza
          </Link>
        </nav>
      </div>
    </main>
  );
}
