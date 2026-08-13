import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie | Rifornio",
  description:
    "Informazioni sull'uso attuale di cookie e tecnologie simili su Rifornio.",
  alternates: {
    canonical: "/cookie",
  },
};

const sectionClassName = "space-y-3";
const headingClassName =
  "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";

export default function CookiePage() {
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
          Cookie e tecnologie simili
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          Questa pagina descrive gli strumenti attualmente presenti in Rifornio
          e distingue ciò che esiste oggi dalle possibili integrazioni future.
        </p>
      </header>

      <div className="mt-8 space-y-9 text-base leading-7 text-zinc-700 dark:text-zinc-300">
        <section className={sectionClassName}>
          <h2 className={headingClassName}>Situazione attuale</h2>
          <p>Nel repository attuale di Rifornio non risultano:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>cookie applicativi impostati direttamente dall&apos;app;</li>
            <li>analytics o strumenti di misurazione del pubblico;</li>
            <li>pixel marketing o sistemi pubblicitari attivi;</li>
            <li>strumenti di session replay;</li>
            <li>uso di localStorage o sessionStorage;</li>
            <li>autenticazione o sessioni associate a un account utente.</li>
          </ul>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Cookie tecnici</h2>
          <p>
            Il codice dell&apos;app non configura direttamente cookie tecnici e non
            contiene oggi una piattaforma per la gestione del consenso. Il
            repository, da solo, non permette però di escludere eventuali dati
            tecnici o tecnologie gestiti dal browser, dall&apos;hosting o da altri
            fornitori infrastrutturali secondo le loro configurazioni.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Servizi esterni</h2>
          <p>
            Rifornio usa servizi infrastrutturali come Vercel, Supabase e Google
            Routes per ospitare l&apos;app, cercare i distributori vicini e calcolare
            le distanze stradali. Il repository non configura tramite questi
            servizi cookie pubblicitari o strumenti di profilazione nel browser.
          </p>
          <p>
            Il comando “Apri nel navigatore” porta a Google Maps in una nuova
            scheda. Da quel momento si utilizza un servizio esterno, soggetto
            alle proprie impostazioni e informative.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Pubblicità e Google AdSense</h2>
          <p>
            Rifornio è attualmente sottoposto alla procedura di revisione di
            Google AdSense. Al momento non pubblica annunci tramite AdSense e il
            relativo script o codice pubblicitario non è attivo nel sito. Nel
            repository non risultano quindi richieste runtime AdSense né cookie
            o tecnologie pubblicitarie collegati a questo servizio.
          </p>
          <p>
            Non risultano inoltre altri sistemi pubblicitari, analytics, Google
            Tag Manager o pixel marketing. Nel pannello AdSense è stata
            configurata la CMP di Google, ma il codice attuale non permette di
            considerarla caricata o mostrata agli utenti: la sua presenza nel
            sito dovrà essere verificata quando verrà integrato il codice
            pubblicitario.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Gestione futura del consenso</h2>
          <p>
            Prima o contestualmente all&apos;attivazione effettiva di AdSense, o di
            altri strumenti pubblicitari, analytics o tecnologie non
            strettamente necessarie, questa pagina verrà aggiornata. Le
            eventuali tecnologie pubblicitarie e le preferenze dell&apos;utente
            saranno gestite tramite il sistema di consenso applicabile, quando
            richiesto.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Come cambiare le preferenze</h2>
          <p>
            Oggi Rifornio non presenta un pannello di preferenze perché nel
            codice non risultano tecnologie opzionali da attivare o disattivare.
            Puoi comunque gestire cookie e dati dei siti tramite le impostazioni
            del browser. Se in futuro verrà introdotto un sistema di consenso,
            questa sezione spiegherà come modificare le scelte effettuate.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Aggiornamenti</h2>
          <p>
            Le informazioni saranno aggiornate se cambieranno gli strumenti
            tecnici usati da Rifornio o le relative modalità di funzionamento.
          </p>
        </section>
      </div>
    </main>
  );
}
