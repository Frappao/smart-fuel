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
const headingClassName = "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";

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
          Questa pagina descrive in modo semplice come l&apos;app tratta oggi i
          dati necessari per cercare e confrontare i distributori.
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
          <p>I dati inseriti o ottenuti durante il calcolo servono a:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>selezionare i distributori nel raggio previsto;</li>
            <li>ottenere distanza e durata stimate del percorso;</li>
            <li>
              confrontare prezzo, distanza e consumo per costruire il ranking;
            </li>
            <li>aprire, su richiesta, il distributore in Google Maps.</li>
          </ul>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Servizi e destinatari tecnici</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Vercel
              </h3>
              <p>
                Ospita l&apos;applicazione e gestisce le normali richieste HTTP
                necessarie a mostrare le pagine e usare le API di Rifornio.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Supabase
              </h3>
              <p>
                Le coordinate vengono inviate alla funzione geografica del
                database per determinare i distributori vicini tramite PostGIS.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Google Routes
              </h3>
              <p>
                Il server trasmette a Google l&apos;origine dell&apos;utente e le
                coordinate dei distributori candidati per ottenere distanza e
                durata stimate del percorso. La chiave API resta sul server.
              </p>
            </div>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Conservazione nell&apos;app</h2>
          <p>
            Nel repository attuale non risultano funzioni che salvano posizione,
            ricerche, importo, consumo o preferenze dell&apos;utente nel database,
            in cookie o nello storage del browser. Questi dati vengono mantenuti
            soltanto per il tempo necessario al calcolo nella pagina aperta.
          </p>
          <p>
            I fornitori infrastrutturali possono trattare dati tecnici secondo
            le proprie configurazioni operative. Il codice di Rifornio non
            definisce né permette di determinare i relativi periodi di
            conservazione.
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
            latitude e longitude nell&apos;URL della relativa API. Il repository non
            contiene log applicativi permanenti di queste richieste, ma non
            descrive le eventuali registrazioni operate dall&apos;infrastruttura.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>
            Cookie e strumenti di tracciamento
          </h2>
          <p>
            Nel codice attuale non risultano cookie applicativi, analytics,
            pixel marketing, pubblicità, strumenti di session replay o sistemi
            di pagamento. Non vengono usati localStorage o sessionStorage per
            conservare dati dell&apos;utente.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Link verso servizi esterni</h2>
          <p>
            Il comando “Apri nel navigatore” apre Google Maps in una nuova
            scheda e include nell&apos;URL le coordinate del distributore scelto, non
            quelle dell&apos;utente. Da quel momento la navigazione avviene sul
            servizio esterno.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Diritti dell&apos;utente</h2>
          <p>
            Puoi negare o revocare il permesso di geolocalizzazione dalle
            impostazioni del browser o del dispositivo. La normativa applicabile
            può inoltre riconoscere diritti relativi ai dati personali, come
            accesso, rettifica, cancellazione, limitazione e opposizione.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Aggiornamenti dell&apos;informativa</h2>
          <p>
            Questa pagina verrà aggiornata quando cambieranno le funzionalità,
            i servizi tecnici utilizzati o le modalità di trattamento descritte.
          </p>
        </section>
      </div>
    </main>
  );
}
