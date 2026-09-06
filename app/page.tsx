import FuelSmartCalculator from "../components/calculation/FuelSmartCalculator";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-none flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-12 lg:py-0 lg:pr-0 lg:pl-8">
        <div className="min-w-0 lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center lg:self-start">
          <div className="flex flex-col gap-8 lg:mx-auto lg:w-full lg:max-w-[340px]">
            <header className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Rifornio
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-300">
                Trova il distributore più conveniente considerando prezzo,
                distanza e consumo.
              </p>
            </header>
            <FuelSmartCalculator />
          </div>
        </div>

        <section
          aria-labelledby="homepage-guide-title"
          className="min-w-0 space-y-8 border-t border-zinc-200 pt-8 sm:pt-10 lg:border-t-0 lg:py-16 lg:pr-6 dark:border-zinc-800"
        >
          <div className="space-y-3">
            <h2
              className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100"
              id="homepage-guide-title"
            >
              Il prezzo più basso non è sempre la scelta migliore
            </h2>
            <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
              Un distributore può offrire un prezzo al litro inferiore, ma
              richiedere una deviazione più lunga. Il carburante consumato per
              raggiungerlo può ridurre o annullare il risparmio ottenuto alla
              pompa.
            </p>
            <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
              Per questo Rifornio confronta ciò che rimane realmente del
              rifornimento dopo aver stimato il carburante necessario per il
              viaggio.
            </p>
          </div>

          <article className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Come decide Rifornio
            </h3>
            <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
              I prezzi della benzina utilizzati da Rifornio provengono dagli
              Open Data ufficiali del Ministero delle Imprese e del Made in
              Italy (MIMIT). A partire da questi dati, Rifornio:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-zinc-700 dark:text-zinc-300">
              <li>individua i distributori vicini;</li>
              <li>
                usa per i candidati la distanza stradale, non soltanto quella
                in linea d&apos;aria;
              </li>
              <li>considera il consumo medio indicato dall&apos;utente;</li>
              <li>
                confronta i litri acquistati con il carburante stimato per il
                viaggio.
              </li>
            </ul>
            <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
              Il distributore consigliato è quello con il maggior numero di
              litri netti stimati.
            </p>
          </article>

          <article className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Un esempio concreto
              </h3>
              <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
                Questo esempio è puramente illustrativo e considera un
                rifornimento da 50 € e un consumo medio di 6 L/100 km.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Distributore A
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  <li>Prezzo benzina: 1,80 €/L</li>
                  <li>Distanza stradale di andata: 2 km</li>
                  <li>Viaggio stimato andata/ritorno: 4 km</li>
                  <li>Litri acquistati: circa 27,78 L</li>
                  <li>Carburante per il viaggio: circa 0,24 L</li>
                  <li className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Litri netti: circa 27,54 L
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Distributore B
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  <li>Prezzo benzina: 1,76 €/L</li>
                  <li>Distanza stradale di andata: 12 km</li>
                  <li>Viaggio stimato andata/ritorno: 24 km</li>
                  <li>Litri acquistati: circa 28,41 L</li>
                  <li>Carburante per il viaggio: circa 1,44 L</li>
                  <li className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Litri netti: circa 26,97 L
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
              In questo caso il distributore A risulta più conveniente, anche
              se il prezzo al litro è maggiore, perché richiede molto meno
              carburante per essere raggiunto.
            </p>
          </article>

          <article className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Dati, stime e trasparenza
            </h3>
            <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
              I prezzi sono quelli comunicati attraverso gli Open Data MIMIT.
              Distanze e consumi sono stime: il consumo reale può cambiare in
              base al traffico, allo stile di guida, al percorso e alle
              condizioni dell&apos;auto.
            </p>
            <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
              Rifornio è uno strumento di confronto e non garantisce che il
              prezzo sia identico a quello presente fisicamente alla pompa nel
              preciso momento dell&apos;arrivo.
            </p>
            <nav
              aria-label="Approfondimenti"
              className="flex flex-col items-start gap-3"
            >
              <a
                className="font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-300"
                href="/come-funziona"
              >
                Scopri nel dettaglio come funziona Rifornio
              </a>
              <a
                className="font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-300"
                href="/guide/distributore-piu-lontano"
              >
                Quando conviene davvero un distributore più lontano?
              </a>
              <a
                className="font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-300"
                href="/guide/consumo-auto-convenienza"
              >
                Quanto incide il consumo dell&apos;auto sulla convenienza?
              </a>
            </nav>
          </article>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-3xl space-y-2 px-4 py-6 text-sm leading-6 text-zinc-600 sm:px-6 dark:text-zinc-400">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">
            Rifornio
          </p>
          <p>
            Dati su impianti e prezzi carburanti:{" "}
            <a
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300"
              href="https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti"
              rel="noopener noreferrer"
              target="_blank"
            >
              Ministero delle Imprese e del Made in Italy (MIMIT)
            </a>
            , licenza{" "}
            <a
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300"
              href="https://www.dati.gov.it/content/italian-open-data-license-v20"
              rel="noopener noreferrer"
              target="_blank"
            >
              IODL 2.0
            </a>
            .
          </p>

          <p>Rifornio è un servizio indipendente e non è affiliato al MIMIT.</p>

          <nav
            aria-label="Informazioni legali"
            className="flex flex-wrap gap-x-4 gap-y-2"
          >
            <a
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300"
              href="/come-funziona"
            >
              Come funziona
            </a>

            <a
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300"
              href="/il-progetto"
            >
              Il progetto
            </a>

            <a
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300"
              href="/supporto"
            >
              Supporto
            </a>

            <a
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300"
              href="/privacy"
            >
              Privacy
            </a>

            <a
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300"
              href="/cookie"
            >
              Cookie
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
