import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie | Rifornio",
  description:
    "Informazioni sull'uso di cookie, pubblicità, Google Analytics e tecnologie simili su Rifornio.",
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
          Questa pagina descrive l&apos;uso attuale di cookie, localStorage,
          strumenti di misurazione, pubblicità e tecnologie simili su Rifornio.
        </p>
      </header>

      <div className="mt-8 space-y-9 text-base leading-7 text-zinc-700 dark:text-zinc-300">
        <section className={sectionClassName}>
          <h2 className={headingClassName}>Situazione attuale</h2>

          <p>
            Rifornio utilizza Google Analytics 4 per misurare in modo statistico
            l&apos;utilizzo del sito. Google Analytics viene però caricato
            soltanto dopo che l&apos;utente ha espresso il proprio consenso.
          </p>

          <p>
            Prima dell&apos;accettazione, il tag di Google Analytics non viene
            caricato e Rifornio non invia dati a Google Analytics tramite tale
            strumento.
          </p>

          <p>
            Rifornio non utilizza attualmente strumenti di session replay,
            sistemi di autenticazione o strumenti di pagamento. Il banner
            pubblicitario Adsterra è descritto nella sezione dedicata.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Analytics: Google Analytics 4
          </h2>

          <p>
            Dopo il consenso, Rifornio carica Google Analytics 4 con ID di
            misurazione <code>G-0323M57ZQP</code>.
          </p>

          <p>
            Google Analytics può raccogliere informazioni come visualizzazioni
            di pagina, sessioni, caratteristiche tecniche del browser e del
            dispositivo e informazioni geografiche approssimative.
          </p>

          <p>
            Quando è consentita la memorizzazione per finalità analytics, Google
            Analytics può utilizzare cookie proprietari, tra cui{" "}
            <code>_ga</code>, per distinguere utenti e sessioni.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Consenso Analytics</h2>

          <p>
            Rifornio utilizza un meccanismo di consenso che impedisce il
            caricamento di Google Analytics finché l&apos;utente non sceglie di
            accettarlo.
          </p>

          <p>
            In caso di accettazione, il consenso relativo ad Analytics viene
            impostato come concesso. Nella configurazione Google, le impostazioni
            relative alla pubblicità, alla personalizzazione pubblicitaria e
            all&apos;utilizzo dei dati per finalità pubblicitarie restano invece
            negate. Queste impostazioni non governano il banner Adsterra.
          </p>

          <p>
            In caso di rifiuto, Google Analytics non viene caricato.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Preferenza salvata nel browser</h2>

          <p>
            Per ricordare la scelta effettuata, Rifornio utilizza il
            localStorage del browser.
          </p>

          <p>
            La preferenza viene salvata con la chiave{" "}
            <code>rifornio-analytics-consent</code> e può contenere il valore{" "}
            <code>granted</code> oppure <code>denied</code>.
          </p>

          <p>
            Questo valore viene utilizzato esclusivamente per ricordare la
            scelta relativa ad Analytics e impedire che la relativa richiesta
            di scelta venga mostrata nuovamente a ogni visita.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Tecnologie necessarie</h2>

          <p>
            Nel codice applicativo attuale non risultano cookie proprietari
            utilizzati per account, autenticazione, preferenze del
            rifornimento, pagamenti o cronologia delle ricerche.
          </p>

          <p>
            Rifornio non utilizza sessionStorage per conservare preferenze o
            dati dell&apos;utente.
          </p>

          <p>
            Restano possibili trattamenti tecnici operati direttamente dal
            browser, dall&apos;hosting o dagli altri provider infrastrutturali,
            secondo il funzionamento dei rispettivi servizi.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Pubblicità Adsterra</h2>

          <p>
            Rifornio utilizza Adsterra come fornitore pubblicitario terzo per
            mostrare un banner dopo i risultati della classifica. Il contenuto
            degli annunci viene erogato dal network e non è selezionato
            direttamente da Rifornio.
          </p>

          <p>
            Adsterra può utilizzare cookie, pixel o altri identificatori per
            erogare e misurare gli annunci e può trattare dati tecnici del
            browser, del dispositivo o della rete e informazioni sulle
            interazioni con gli annunci. L&apos;uso effettivo di tali tecnologie
            dipende dalla configurazione e dalle modalità del provider.
          </p>

          <p>
            Per maggiori dettagli è possibile consultare la{" "}
            <a
              className="font-medium underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:hover:text-emerald-300"
              href="https://adsterra.com/privacy-policy-managed/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Privacy Policy
            </a>{" "}
            e la{" "}
            <a
              className="font-medium underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:hover:text-emerald-300"
              href="https://adsterra.com/cookies/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Cookie Policy
            </a>{" "}
            di Adsterra.
          </p>

          <p>
            La pubblicità Adsterra è separata da Google Analytics. La preferenza{" "}
            <code>rifornio-analytics-consent</code> controlla esclusivamente il
            caricamento di Analytics e non quello del banner Adsterra.
            L&apos;interfaccia attuale di Rifornio non offre una preferenza
            pubblicitaria separata.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Come cambiare la preferenza</h2>

          <p>
            Attualmente la scelta Analytics viene memorizzata nel localStorage
            del browser. È possibile eliminarla tramite le impostazioni del
            browser o cancellando i dati del sito relativi a Rifornio.
          </p>

          <p>
            Dopo la cancellazione della preferenza, alla visita successiva
            Rifornio mostrerà nuovamente la richiesta di scelta Analytics.
            Questa operazione non modifica il caricamento della pubblicità
            Adsterra.
          </p>

          <p>
            Per gestire o eliminare cookie e dati dei siti è possibile utilizzare
            le impostazioni del browser. Il blocco di alcune tecnologie può
            influire sulla visualizzazione o sul funzionamento degli annunci.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Privacy</h2>

          <p>
            Per maggiori informazioni sul trattamento dei dati durante
            l&apos;utilizzo del servizio consulta la{" "}
            <Link href="/privacy">pagina Privacy</Link>.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Aggiornamenti</h2>

          <p>
            Questa pagina verrà aggiornata quando cambieranno gli strumenti di
            misurazione, pubblicità o gestione del consenso utilizzati da
            Rifornio.
          </p>
        </section>
      </div>
    </main>
  );
}
