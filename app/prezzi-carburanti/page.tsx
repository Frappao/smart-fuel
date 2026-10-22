import type { Metadata } from 'next'
import Link from 'next/link'
import { POPULAR_CITIES } from '../../lib/cities/popularCities'

export const metadata: Metadata = {
  title: 'Prezzi Benzina, Diesel e GPL in Italia | Rifornio',
  description:
    'Consulta i prezzi dei carburanti aggiornati nelle principali città italiane. Confronta le medie locali e scopri il distributore più conveniente con Rifornio.',
  alternates: {
    canonical: '/prezzi-carburanti',
  },
  openGraph: {
    title: 'Prezzi Carburanti nelle Città Italiane — Rifornio',
    description:
      'Trova i distributori più economici e calcola il risparmio reale per la tua auto in ogni comune italiano.',
    url: 'https://rifornio.it/prezzi-carburanti',
  },
}

export default function PrezziCarburantiIndexPage() {
  // Group cities by region
  const citiesByRegion = POPULAR_CITIES.reduce<Record<string, typeof POPULAR_CITIES>>((acc, city) => {
    const region = city.region || 'Altre'
    if (!acc[region]) acc[region] = []
    acc[region].push(city)
    return acc
  }, {})

  const regions = Object.keys(citiesByRegion).sort((a, b) => a.localeCompare(b))

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <nav aria-label="Navigazione principale" className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
            Rifornio
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
          >
            Apri Calcolatore
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:underline">Home</Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-zinc-800 dark:text-zinc-200">Prezzi Carburanti</li>
          </ol>
        </nav>

        <header className="mb-10 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
            Prezzi Carburanti nelle Città Italiane
          </h1>
          <p className="max-w-3xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-300">
            Seleziona la tua città per visualizzare i prezzi aggiornati di benzina, gasolio e GPL e scoprire quale distributore conviene davvero raggiungere.
          </p>
        </header>

        <div className="space-y-10">
          {regions.map((region) => (
            <section key={region} aria-labelledby={`region-${region}`} className="space-y-4">
              <h2
                id={`region-${region}`}
                className="text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-200"
              >
                {region}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {citiesByRegion[region].map((city) => (
                  <Link
                    key={city.slug}
                    href={`/prezzi-carburanti/${city.slug}`}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-600 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-emerald-400"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{city.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Provincia di {city.province}</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Vedi prezzi →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>Rifornio — Dati ufficiali MIMIT (Ministero delle Imprese e del Made in Italy). Licenza IODL 2.0.</p>
      </footer>
    </div>
  )
}
