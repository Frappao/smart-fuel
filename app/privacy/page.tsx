import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | Rifornio",
  description:
    "Informazioni sul trattamento tecnico dei dati durante l'uso di Rifornio.",
  alternates: {
    canonical: "/privacy",
  },
};

const sectionClassName = "space-y-3";

const headingClassName =
  "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";

export default function PrivacyPage() {
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
          Privacy su Rifornio
        </h1>

        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          Questa pagina descrive in modo semplice come Rifornio tratta i dati
          durante l&apos;utilizzo del servizio.
        </p>
      </header>

      <div className="mt-8 space-y-9 text-base leading-7 text-zinc-700 dark:text-zinc-300">
        <section className={sectionClassName}>
          <h2 className={headingClassName}>Dati trattati</h2>

          <p>Durante un calcolo Rifornio tratta:</p>

          <ul className="list-disc space-y-2 pl-5">
            <li>latitude e longitude fornite dal browser;</li>
            <li>tipo di carburante e modalità Self o Servito selezionati;</li>
            <li>importo del rifornimento e consumo medio indicati;</li>
            <li>dati pubblici dei distributori e dei prezzi carburante.</li>
          </ul>

          <p>
            Importo e consumo vengono usati nel browser per il calcolo della
            convenienza e non risultano inviati alle API di ricerca o routing.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Geolocalizzazione</h2>

          <p>
            La posizione viene richiesta soltanto quando avvii il calcolo. Il
            browser mostra la propria richiesta di permesso e puoi negarla o
            gestirla dalle impostazioni del dispositivo.
          </p>

          <p>
            Latitude e longitude vengono usate per individuare i distributori
            vicini e calcolare le distanze stradali. Nel codice attuale non
            risultano salvate nelle tabelle del database applicativo.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Finalità tecniche</h2>

          <p>
            I dati inseriti e la posizione vengono utilizzati esclusivamente
            per trovare i distributori compatibili con la ricerca, calcolare
            le distanze stradali e determinare la convenienza del rifornimento.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Servizi e destinatari tecnici
          </h2>

          <p>
            Per fornire il servizio Rifornio utilizza infrastrutture e servizi
            tecnici esterni.
          </p>

          <ul className="list-disc space-y-2 pl-5">
            <li>
              Vercel, per l&apos;hosting e l&apos;esecuzione dell&apos;applicazione web.
            </li>
            <li>
              Supabase, PostgreSQL e PostGIS, per i dati dei distributori,
              prezzi e ricerca geografica.
            </li>
            <li>
              Google Routes, per calcolare le distanze stradali tra la
              posizione dell&apos;utente e i distributori candidati.
            </li>
          </ul>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Conservazione nell&apos;app</h2>

          <p>
            Rifornio non dispone di account utente e non mantiene nel database
            applicativo una cronologia delle ricerche o delle posizioni
            utilizzate per i calcoli.
          </p>

          <p>
            La precisione GPS fornita dal browser resta nel dispositivo e non
            viene inviata alle API di Rifornio.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Dati di navigazione e infrastrutturali
          </h2>

          <p>
            Come avviene normalmente per un servizio web, l&apos;infrastruttura di
            hosting può trattare dati tecnici HTTP, per esempio indirizzo IP,
            data e ora, user agent, percorso richiesto e stato della risposta.
          </p>

          <p>
            La richiesta per trovare i distributori include tecnicamente
            latitude e longitude nell&apos;URL della relativa API. Il repository
            non contiene log applicativi permanenti di queste richieste, ma
            non descrive le eventuali registrazioni operate
            dall&apos;infrastruttura.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Google Analytics e strumenti di misurazione
          </h2>

          <p>
            Rifornio utilizza Google Analytics 4 per ottenere informazioni
            statistiche sull&apos;utilizzo del sito, come numero di utenti,
            visualizzazioni di pagina, sessioni, informazioni sul browser e sul
            dispositivo e dati geografici approssimativi.
          </p>

          <p>
            Google Analytics viene caricato soltanto dopo che l&apos;utente ha
            espresso il proprio consenso tramite il banner dedicato. Se il
            consenso non viene fornito, il tag Google Analytics non viene
            caricato.
          </p>

          <p>
            Quando Analytics viene attivato, Google può utilizzare cookie
            proprietari come <code>_ga</code> per distinguere utenti e sessioni.
            Google Analytics utilizza inoltre l&apos;indirizzo IP durante la
            raccolta per ricavare informazioni geografiche approssimative.
          </p>

          <p>
            Le funzionalità pubblicitarie di Google Analytics e Google Signals
            sono disattivate nella configurazione attuale. I consensi relativi
            a pubblicità, personalizzazione pubblicitaria e utilizzo dei dati
            per finalità pubblicitarie restano impostati su negato.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Preferenza Analytics</h2>

          <p>
            La scelta relativa all&apos;uso di Google Analytics viene memorizzata
            nel localStorage del browser con la chiave{" "}
            <code>rifornio-analytics-consent</code>. Questo valore viene usato
            esclusivamente per ricordare se l&apos;utente ha accettato o rifiutato
            Analytics e per evitare di mostrare il banner a ogni visita.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Google AdSense</h2>

          <p>
            Rifornio è stato sottoposto alla procedura di revisione di Google
            AdSense, ma al momento non pubblica annunci tramite questo servizio
            e il relativo codice pubblicitario non è attivo.
          </p>

          <p>
            Se il servizio pubblicitario verrà attivato, questa informativa e
            la gestione del consenso saranno aggiornate in base al
            funzionamento effettivo.
          </p>

          <p>
            Ulteriori informazioni su cookie e tecnologie simili sono
            disponibili nella <Link href="/cookie">Cookie Policy</Link>.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Link verso servizi esterni</h2>

          <p>
            Il comando “Apri nel navigatore” apre Google Maps in una nuova
            scheda e include nell&apos;URL le coordinate del distributore scelto,
            non quelle dell&apos;utente. Da quel momento la navigazione avviene sul
            servizio esterno.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Diritti dell&apos;utente</h2>

          <p>
            Puoi negare o revocare il permesso di geolocalizzazione dalle
            impostazioni del browser o del dispositivo. La normativa
            applicabile può inoltre riconoscere diritti relativi ai dati
            personali, come accesso, rettifica, cancellazione, limitazione e
            opposizione.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Aggiornamenti dell&apos;informativa
          </h2>

          <p>
            Questa pagina verrà aggiornata quando cambieranno le funzionalità,
            i servizi tecnici utilizzati o le modalità di trattamento
            descritte.
          </p>
        </section>
      </div>
    </main>
  );
}