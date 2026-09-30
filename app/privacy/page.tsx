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
            <li>
              latitude e longitude fornite dal browser o dall&apos;app, quando
              scegli di usare la posizione attuale;
            </li>
            <li>
              indirizzi o nomi di località cercati per impostare partenza e
              destinazione di un viaggio;
            </li>
            <li>tipo di carburante e modalità Self o Servito selezionati;</li>
            <li>importo del rifornimento e consumo medio indicati;</li>
            <li>dati pubblici dei distributori e dei prezzi carburante.</li>
          </ul>

          <p>
            Nella ricerca vicino alla posizione, importo e consumo vengono
            elaborati dal client. Nel calcolo lungo un percorso vengono inviati
            all&apos;API di Rifornio insieme alle coordinate selezionate, perché il
            ranking della deviazione viene eseguito sul server.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Geolocalizzazione</h2>

          <p>
            La posizione viene richiesta soltanto quando avvii un calcolo che
            usa la posizione attuale. Il browser o il sistema operativo mostra
            la propria richiesta di permesso e puoi negarla o gestirla dalle
            impostazioni del dispositivo. Per pianificare un altro viaggio puoi
            invece cercare e selezionare manualmente la partenza.
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
              Mapbox Geocoding, Directions e Matrix, per cercare le località,
              ottenere il percorso e calcolare le distanze stradali dei
              distributori candidati. Le richieste vengono effettuate dal
              server di Rifornio.
            </li>
          </ul>
          <p>
            Per informazioni sul trattamento operato dal provider consulta la{" "}
            <a
              className="font-medium underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:hover:text-emerald-300"
              href="https://www.mapbox.com/legal/privacy"
              rel="noopener noreferrer"
              target="_blank"
            >
              Product Privacy Policy di Mapbox
            </a>
            .
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Conservazione nell&apos;app</h2>

          <p>
            Rifornio non dispone di account utente e non mantiene nel database
            applicativo una cronologia delle ricerche o delle posizioni
            utilizzate per i calcoli.
          </p>

          <p>
            La precisione GPS fornita dal browser o dal dispositivo resta nel
            client: Rifornio invia alle proprie API soltanto latitude e
            longitude necessarie al calcolo.
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
            La ricerca dei distributori vicini include tecnicamente latitude e
            longitude nell&apos;URL della relativa API. Le ricerche di indirizzi e
            i calcoli lungo un percorso utilizzano invece richieste POST. Il
            repository non contiene log applicativi permanenti di queste
            richieste, ma non descrive le eventuali registrazioni operate
            dall&apos;infrastruttura o dai provider tecnici.
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
          <h2 className={headingClassName}>Pubblicità Adsterra</h2>

          <p>
            Rifornio utilizza Adsterra come fornitore pubblicitario terzo per
            mostrare un banner dopo i risultati della classifica. Il contenuto
            pubblicitario è erogato dal network e Rifornio non seleziona
            direttamente i singoli annunci mostrati.
          </p>

          <p>
            Durante l&apos;erogazione degli annunci, Adsterra può utilizzare
            tecnologie come cookie, pixel o altri identificatori e trattare dati
            tecnici relativi al browser, al dispositivo o alla rete, oltre a
            informazioni sulla visualizzazione e sulle interazioni con gli
            annunci. Tali attività dipendono dalla configurazione e avvengono
            secondo le modalità proprie del provider.
          </p>

          <p>
            Adsterra dispone di una propria{" "}
            <a
              className="font-medium underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:hover:text-emerald-300"
              href="https://adsterra.com/privacy-policy-managed/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Privacy Policy
            </a>{" "}
            e di una propria{" "}
            <a
              className="font-medium underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:hover:text-emerald-300"
              href="https://adsterra.com/cookies/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Cookie Policy
            </a>
            .
          </p>

          <p>
            Il sistema pubblicitario Adsterra è distinto da Google Analytics.
            La preferenza salvata con la chiave{" "}
            <code>rifornio-analytics-consent</code> riguarda esclusivamente
            Analytics e non controlla il caricamento del banner Adsterra.
          </p>

          <p>
            Ulteriori informazioni su cookie e tecnologie simili sono
            disponibili nella <Link href="/cookie">Cookie Policy</Link>.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Link verso servizi esterni</h2>

          <p>
            Per una ricerca nelle vicinanze, il comando “Apri nel navigatore”
            include nell&apos;URL di Google Maps le coordinate del distributore
            scelto. Per un viaggio pianificato, il link include anche le
            coordinate di partenza, destinazione e sosta. Da quel momento la
            navigazione avviene sul servizio esterno.
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
