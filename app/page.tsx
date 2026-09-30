import FuelSearchCalculator from "../components/calculation/FuelSearchCalculator";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:h-dvh lg:min-h-0 lg:flex-none lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-12 lg:overflow-hidden lg:px-8 lg:py-8">
        <div
          aria-label="Calcolatore e risultati"
          role="region"
          tabIndex={0}
          className="min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-y-contain lg:pr-4 dark:focus-visible:outline-emerald-400"
        >
          <div className="flex w-full flex-col gap-8">
            <header className="space-y-4">
              <p className="text-lg font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
                Rifornio
              </p>
              <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                Fai rifornimento dove conviene davvero.
              </h1>
              <p className="max-w-xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-300">
                Trova il distributore più conveniente considerando prezzo,
                distanza e consumo.
              </p>
            </header>
            <FuelSearchCalculator />
          </div>
        </div>

        <section
          aria-labelledby="homepage-guide-title"
          tabIndex={0}
          className="min-w-0 space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:p-6 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-y-contain dark:border-zinc-800 dark:bg-zinc-900/40 dark:focus-visible:outline-emerald-400"
        >
          <div className="space-y-3">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              La guida alla convenienza
            </p>
            <h2
              className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100"
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

          <details className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <summary className="cursor-pointer rounded-sm py-1 font-semibold text-zinc-900 marker:text-emerald-600 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 dark:text-zinc-100 dark:hover:text-emerald-300 dark:focus-visible:outline-emerald-400">
              Come decide Rifornio
            </summary>
            <div className="mt-4 space-y-3">
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
            </div>
          </details>

          <details className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <summary className="cursor-pointer rounded-sm py-1 font-semibold text-zinc-900 marker:text-emerald-600 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 dark:text-zinc-100 dark:hover:text-emerald-300 dark:focus-visible:outline-emerald-400">
              Un esempio concreto
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
                Questo esempio è puramente illustrativo e considera un
                rifornimento da 50 € e un consumo medio di 6 L/100 km.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
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
            </div>
          </details>

          <details className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <summary className="cursor-pointer rounded-sm py-1 font-semibold text-zinc-900 marker:text-emerald-600 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 dark:text-zinc-100 dark:hover:text-emerald-300 dark:focus-visible:outline-emerald-400">
              Dati, stime e trasparenza
            </summary>
            <div className="mt-4 space-y-3">
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
            </div>
          </details>
          <nav
            aria-label="Approfondimenti"
            className="flex flex-col items-start gap-3 border-t border-zinc-200 pt-5 text-sm leading-6 dark:border-zinc-800"
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
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-7xl space-y-2 px-4 py-6 text-sm leading-6 text-zinc-600 sm:px-6 lg:px-8 dark:text-zinc-400">
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
