import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie | Rifornio",
  description:
    "Informazioni sull'uso di cookie, Google Analytics e tecnologie simili su Rifornio.",
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
          strumenti di misurazione e tecnologie simili su Rifornio.
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
            Rifornio non utilizza attualmente pixel marketing, strumenti di
            session replay, sistemi di autenticazione o strumenti di pagamento.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Google Analytics 4</h2>

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
          <h2 className={headingClassName}>Gestione del consenso</h2>

          <p>
            Rifornio utilizza un meccanismo di consenso che impedisce il
            caricamento di Google Analytics finché l&apos;utente non sceglie di
            accettarlo.
          </p>

          <p>
            In caso di accettazione, il consenso relativo ad Analytics viene
            impostato come concesso. Le impostazioni relative alla pubblicità,
            alla personalizzazione pubblicitaria e all&apos;utilizzo dei dati
            per finalità pubblicitarie restano invece negate.
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
            scelta relativa ad Analytics e impedire che il banner venga
            mostrato nuovamente a ogni visita.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Cookie tecnici e altri strumenti</h2>

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
          <h2 className={headingClassName}>Google AdSense</h2>

          <p>
            Rifornio è attualmente sottoposto alla procedura di revisione di
            Google AdSense, ma il codice pubblicitario AdSense non è attivo sul
            sito e non vengono ancora pubblicati annunci tramite questo
            servizio.
          </p>

          <p>
            La configurazione relativa alla pubblicità verrà aggiornata, insieme
            a questa pagina e alla gestione del consenso, prima
            dell&apos;eventuale attivazione effettiva di AdSense.
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
            Rifornio mostrerà nuovamente il banner Analytics.
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