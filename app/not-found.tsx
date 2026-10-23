import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <nav aria-label="Navigazione principale" className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
            Rifornio
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
          >
            Apri Calcolatore
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          Errore 404
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
          Pagina non trovata
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-300">
          La pagina che stai cercando non esiste o è stata spostata. Prova a calcolare la convenienza del tuo rifornimento o consulta i prezzi aggiornati nelle città.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
          >
            Vai al Calcolatore
          </Link>
          <Link
            href="/prezzi-carburanti"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Prezzi Carburanti nelle Città
          </Link>
        </div>

        <div className="mt-12 w-full border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            Città più cercate
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              { name: 'Roma', slug: 'roma' },
              { name: 'Milano', slug: 'milano' },
              { name: 'Napoli', slug: 'napoli' },
              { name: 'Torino', slug: 'torino' },
              { name: 'Palermo', slug: 'palermo' },
              { name: 'Genova', slug: 'genova' },
              { name: 'Bologna', slug: 'bologna' },
              { name: 'Firenze', slug: 'firenze' },
            ].map((city) => (
              <Link
                key={city.slug}
                href={`/prezzi-carburanti/${city.slug}`}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-emerald-600 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>Rifornio — Fai rifornimento dove conviene davvero.</p>
      </footer>
    </div>
  )
}
