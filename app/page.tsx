import FuelSmartCalculator from "../components/calculation/FuelSmartCalculator";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Rifornio
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-300">
            Trova il distributore più conveniente considerando prezzo, distanza
            e consumo.
          </p>
        </header>
        <FuelSmartCalculator />
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
