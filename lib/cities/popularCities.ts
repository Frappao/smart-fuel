export interface PopularCity {
  slug: string
  name: string
  province: string
  region: string
  latitude: number
  longitude: number
}

export const POPULAR_CITIES: PopularCity[] = [
  { slug: 'roma', name: 'Roma', province: 'RM', region: 'Lazio', latitude: 41.9028, longitude: 12.4964 },
  { slug: 'milano', name: 'Milano', province: 'MI', region: 'Lombardia', latitude: 45.4642, longitude: 9.19 },
  { slug: 'napoli', name: 'Napoli', province: 'NA', region: 'Campania', latitude: 40.8518, longitude: 14.2681 },
  { slug: 'torino', name: 'Torino', province: 'TO', region: 'Piemonte', latitude: 45.0703, longitude: 7.6869 },
  { slug: 'palermo', name: 'Palermo', province: 'PA', region: 'Sicilia', latitude: 38.1157, longitude: 13.3615 },
  { slug: 'genova', name: 'Genova', province: 'GE', region: 'Liguria', latitude: 44.4056, longitude: 8.9463 },
  { slug: 'bologna', name: 'Bologna', province: 'BO', region: 'Emilia-Romagna', latitude: 44.4949, longitude: 11.3426 },
  { slug: 'firenze', name: 'Firenze', province: 'FI', region: 'Toscana', latitude: 43.7696, longitude: 11.2558 },
  { slug: 'bari', name: 'Bari', province: 'BA', region: 'Puglia', latitude: 41.1171, longitude: 16.8719 },
  { slug: 'catania', name: 'Catania', province: 'CT', region: 'Sicilia', latitude: 37.5079, longitude: 15.0873 },
  { slug: 'verona', name: 'Verona', province: 'VR', region: 'Veneto', latitude: 45.4384, longitude: 10.9916 },
  { slug: 'venezia', name: 'Venezia', province: 'VE', region: 'Veneto', latitude: 45.4408, longitude: 12.3155 },
  { slug: 'messina', name: 'Messina', province: 'ME', region: 'Sicilia', latitude: 38.1938, longitude: 15.554 },
  { slug: 'padova', name: 'Padova', province: 'PD', region: 'Veneto', latitude: 45.4064, longitude: 11.8768 },
  { slug: 'trieste', name: 'Trieste', province: 'TS', region: 'Friuli-Venezia Giulia', latitude: 45.6495, longitude: 13.7768 },
  { slug: 'brescia', name: 'Brescia', province: 'BS', region: 'Lombardia', latitude: 45.5416, longitude: 10.2118 },
  { slug: 'taranto', name: 'Taranto', province: 'TA', region: 'Puglia', latitude: 40.4644, longitude: 17.247 },
  { slug: 'parma', name: 'Parma', province: 'PR', region: 'Emilia-Romagna', latitude: 44.8015, longitude: 10.3279 },
  { slug: 'prato', name: 'Prato', province: 'PO', region: 'Toscana', latitude: 43.8777, longitude: 11.1022 },
  { slug: 'modena', name: 'Modena', province: 'MO', region: 'Emilia-Romagna', latitude: 44.6471, longitude: 10.9252 },
  { slug: 'reggio-calabria', name: 'Reggio Calabria', province: 'RC', region: 'Calabria', latitude: 38.1113, longitude: 15.6473 },
  { slug: 'reggio-emilia', name: 'Reggio Emilia', province: 'RE', region: 'Emilia-Romagna', latitude: 44.6983, longitude: 10.6312 },
  { slug: 'perugia', name: 'Perugia', province: 'PG', region: 'Umbria', latitude: 43.1107, longitude: 12.3908 },
  { slug: 'ravenna', name: 'Ravenna', province: 'RA', region: 'Emilia-Romagna', latitude: 44.4184, longitude: 12.2035 },
  { slug: 'livorno', name: 'Livorno', province: 'LI', region: 'Toscana', latitude: 43.5485, longitude: 10.3106 },
  { slug: 'cagliari', name: 'Cagliari', province: 'CA', region: 'Sardegna', latitude: 39.2238, longitude: 9.1217 },
  { slug: 'foggia', name: 'Foggia', province: 'FG', region: 'Puglia', latitude: 41.4622, longitude: 15.5447 },
  { slug: 'rimini', name: 'Rimini', province: 'RN', region: 'Emilia-Romagna', latitude: 44.0678, longitude: 12.5695 },
  { slug: 'salerno', name: 'Salerno', province: 'SA', region: 'Campania', latitude: 40.6824, longitude: 14.7681 },
  { slug: 'ferrara', name: 'Ferrara', province: 'FE', region: 'Emilia-Romagna', latitude: 44.8381, longitude: 11.6198 },
  { slug: 'saronno', name: 'Saronno', province: 'VA', region: 'Lombardia', latitude: 45.6264, longitude: 9.0356 },
  { slug: 'monza', name: 'Monza', province: 'MB', region: 'Lombardia', latitude: 45.5845, longitude: 9.2744 },
  { slug: 'bergamo', name: 'Bergamo', province: 'BG', region: 'Lombardia', latitude: 45.6983, longitude: 9.6773 },
  { slug: 'como', name: 'Como', province: 'CO', region: 'Lombardia', latitude: 45.8081, longitude: 9.0852 },
  { slug: 'varese', name: 'Varese', province: 'VA', region: 'Lombardia', latitude: 45.8206, longitude: 8.8251 },
]

export function formatCityFromSlug(slug: string): string {
  const match = POPULAR_CITIES.find((c) => c.slug === slug.toLowerCase())
  if (match) return match.name

  // Fallback: capitalize words from slug, e.g. "san-donato-milanese" -> "San Donato Milanese"
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
