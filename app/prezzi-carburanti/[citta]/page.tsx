import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { formatCityFromSlug, POPULAR_CITIES } from '../../../lib/cities/popularCities'
import { getCityStations } from '../../../lib/stations/getCityStations'

interface PageProps {
  params: Promise<{ citta: string }>
}

export const revalidate = 3600 // ISR: revalidate every hour

export async function generateStaticParams() {
  return POPULAR_CITIES.map((city) => ({
    citta: city.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citta } = await params
  const cleanSlug = decodeURIComponent(citta).replace(/[\[\]]/g, '').trim().toLowerCase()
  const cityName = formatCityFromSlug(cleanSlug)

  return {
    title: `Prezzi Benzina e Gasolio a ${cityName} | Distributori Convenienti — Rifornio`,
    description: `Prezzi aggiornati di benzina, diesel e GPL a ${cityName}. Confronta i distributori ed evita di sprecare carburante per raggiungere quello sbagliato.`,
    alternates: {
      canonical: `/prezzi-carburanti/${cleanSlug}`,
    },
    openGraph: {
      title: `Prezzi Carburanti a ${cityName} — Rifornio`,
      description: `Scopri dove fare rifornimento a ${cityName} considerando prezzo alla pompa e consumi di viaggio.`,
      url: `https://rifornio.it/prezzi-carburanti/${cleanSlug}`,
    },
  }
}

export default async function CityFuelPage({ params }: PageProps) {
  const { citta } = await params
  const decodedCitta = decodeURIComponent(citta).trim()
  const cleanSlug = decodedCitta.replace(/[\[\]]/g, '').trim().toLowerCase()

  if (!cleanSlug || cleanSlug.length > 50) {
    notFound()
  }

  // If the user arrived with brackets, uppercase, or URL encoding (e.g. /prezzi-carburanti/[saronno]),
  // redirect them to the clean canonical URL /prezzi-carburanti/saronno
  if (citta !== cleanSlug) {
    redirect(`/prezzi-carburanti/${cleanSlug}`)
  }

  const cityName = formatCityFromSlug(cleanSlug)
  const cityData = await getCityStations(cityName)
  const popularCityInfo = POPULAR_CITIES.find((c) => c.slug === cleanSlug)
  const provinceLabel = cityData.province || popularCityInfo?.province || ''


  // Sort stations so that those with self benzina or gasolio prices are listed first by price
  const sortedStations = [...cityData.stations].sort((a, b) => {
    const priceA = a.prices.find((p) => p.fuelType === 'Benzina' && p.isSelf)?.price ?? 999
    const priceB = b.prices.find((p) => p.fuelType === 'Benzina' && p.isSelf)?.price ?? 999
    return priceA - priceB
  })

  // Json-Ld Breadcrumbs
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://rifornio.it/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Prezzi Carburanti',
        item: 'https://rifornio.it/prezzi-carburanti',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cityName,
        item: `https://rifornio.it/prezzi-carburanti/${citta}`,
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            <li>
              <Link href="/prezzi-carburanti" className="hover:underline">Prezzi Carburanti</Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-zinc-800 dark:text-zinc-200">{cityName}</li>
          </ol>
        </nav>

        <header className="mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Dati MIMIT ufficiali
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
            Prezzi Carburanti a {cityName} {provinceLabel ? `(${provinceLabel})` : ''}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-300">
            Confronta i prezzi di benzina, gasolio e GPL praticati dai distributori di {cityName}. Scopri le medie del comune e calcola quale conviene davvero raggiungere.
          </p>
        </header>

        {/* Panoramica Statistiche */}
        <section aria-label="Statistiche prezzi" className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">Benzina (Self)</p>
            {cityData.stats.benzinaSelf ? (
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {cityData.stats.benzinaSelf.min.toFixed(3)} €
                  </span>
                  <span className="text-xs text-zinc-500">prezzo minimo</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Media a {cityName}: <strong className="text-zinc-800 dark:text-zinc-200">{cityData.stats.benzinaSelf.avg.toFixed(3)} €/L</strong>
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Prezzo non disponibile oggi</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">Gasolio / Diesel (Self)</p>
            {cityData.stats.gasolioSelf ? (
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {cityData.stats.gasolioSelf.min.toFixed(3)} €
                  </span>
                  <span className="text-xs text-zinc-500">prezzo minimo</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Media a {cityName}: <strong className="text-zinc-800 dark:text-zinc-200">{cityData.stats.gasolioSelf.avg.toFixed(3)} €/L</strong>
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Prezzo non disponibile oggi</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">GPL</p>
            {cityData.stats.gpl ? (
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {cityData.stats.gpl.min.toFixed(3)} €
                  </span>
                  <span className="text-xs text-zinc-500">prezzo minimo</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Media a {cityName}: <strong className="text-zinc-800 dark:text-zinc-200">{cityData.stats.gpl.avg.toFixed(3)} €/L</strong>
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Nessun impianto GPL segnalato</p>
            )}
          </div>
        </section>

        {/* Banner di Conversione / Claim Rifornio */}
        <section
          aria-label="Convenienza reale"
          className="mb-10 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm dark:border-emerald-800/80 dark:from-emerald-950/40 dark:to-zinc-900"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl dark:text-emerald-100">
                Il prezzo più basso alla pompa conviene davvero?
              </h2>
              <p className="text-sm leading-6 text-emerald-900 dark:text-emerald-200">
                Se per risparmiare 2 centesimi al litro devi percorrere 5 km in più attraverso {cityName}, il carburante consumato durante il tragitto può azzerare il guadagno. <strong>Rifornio calcola i litri netti effettivi</strong> considerando la distanza stradale e i consumi della tua auto.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
            >
              Calcola la convenienza reale
            </Link>
          </div>
        </section>

        {/* Elenco Distributori */}
        <section aria-labelledby="stations-list-title" className="mb-12">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div>
              <h2 id="stations-list-title" className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Distributori a {cityName}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {sortedStations.length > 0
                  ? `${sortedStations.length} impianti censiti nel comune`
                  : `Nessun distributore trovato direttamente nel comune di ${cityName}.`}
              </p>
            </div>
          </div>

          {sortedStations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
              <p className="text-base text-zinc-600 dark:text-zinc-300">
                Non sono presenti impianti nel database per questo specifico comune, oppure il database locale è in fase di sincronizzazione.
              </p>
              <div className="mt-4">
                <Link
                  href="/"
                  className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  Usa la geolocalizzazione per trovare gli impianti più vicini
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedStations.map((station) => (
                <article
                  key={station.id}
                  className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-block rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                        {station.brand || 'Pompa Bianca / Indipendente'}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {station.name || `${station.brand || 'Distributore'} ${cityName}`}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {station.address || cityName}
                    </p>

                    <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      {station.prices.length === 0 ? (
                        <p className="text-xs text-zinc-400">Nessun prezzo recente comunicato</p>
                      ) : (
                        station.prices.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-zinc-600 dark:text-zinc-300">
                              {p.fuelType} {p.isSelf ? '(Self)' : '(Servito)'}:
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              {p.price.toFixed(3)} €/L
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${station.brand ?? ''} ${station.address ?? ''} ${cityName}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Indicazioni Stradali
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Altre Città */}
        <section aria-labelledby="other-cities-title" className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 id="other-cities-title" className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Prezzi carburanti nelle altre città
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {POPULAR_CITIES.filter((c) => c.slug !== citta.toLowerCase()).slice(0, 16).map((c) => (
              <Link
                key={c.slug}
                href={`/prezzi-carburanti/${c.slug}`}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-emerald-600 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              >
                {c.name} ({c.province})
              </Link>
            ))}
            <Link
              href="/prezzi-carburanti"
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
            >
              Tutte le città →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>Rifornio — Dati ufficiali MIMIT (Ministero delle Imprese e del Made in Italy). Licenza IODL 2.0.</p>
      </footer>
    </div>
  )
}
