export interface PopularCity {
  slug: string
  name: string
  province: string
  region: string
  latitude: number
  longitude: number
}

export const POPULAR_CITIES: PopularCity[] = [
  // Grandi città e capoluoghi storici già presenti
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
  // Piemonte
  { slug: 'novara', name: 'Novara', province: 'NO', region: 'Piemonte', latitude: 45.4469, longitude: 8.6213 },
  { slug: 'alessandria', name: 'Alessandria', province: 'AL', region: 'Piemonte', latitude: 44.9129, longitude: 8.6153 },
  { slug: 'asti', name: 'Asti', province: 'AT', region: 'Piemonte', latitude: 44.9007, longitude: 8.2069 },
  { slug: 'cuneo', name: 'Cuneo', province: 'CN', region: 'Piemonte', latitude: 44.3845, longitude: 7.5427 },
  { slug: 'vercelli', name: 'Vercelli', province: 'VC', region: 'Piemonte', latitude: 45.3259, longitude: 8.4239 },
  { slug: 'biella', name: 'Biella', province: 'BI', region: 'Piemonte', latitude: 45.5661, longitude: 8.0538 },
  { slug: 'verbania', name: 'Verbania', province: 'VB', region: 'Piemonte', latitude: 45.9224, longitude: 8.5516 },
  // Valle d'Aosta
  { slug: 'aosta', name: 'Aosta', province: 'AO', region: "Valle d'Aosta", latitude: 45.7372, longitude: 7.3201 },
  // Liguria
  { slug: 'la-spezia', name: 'La Spezia', province: 'SP', region: 'Liguria', latitude: 44.1025, longitude: 9.8241 },
  { slug: 'savona', name: 'Savona', province: 'SV', region: 'Liguria', latitude: 44.3079, longitude: 8.4811 },
  { slug: 'imperia', name: 'Imperia', province: 'IM', region: 'Liguria', latitude: 43.8864, longitude: 8.0287 },
  { slug: 'sanremo', name: 'Sanremo', province: 'IM', region: 'Liguria', latitude: 43.8159, longitude: 7.7761 },
  // Lombardia
  { slug: 'pavia', name: 'Pavia', province: 'PV', region: 'Lombardia', latitude: 45.1847, longitude: 9.1582 },
  { slug: 'cremona', name: 'Cremona', province: 'CR', region: 'Lombardia', latitude: 45.1333, longitude: 10.0227 },
  { slug: 'mantova', name: 'Mantova', province: 'MN', region: 'Lombardia', latitude: 45.1564, longitude: 10.7914 },
  { slug: 'lecco', name: 'Lecco', province: 'LC', region: 'Lombardia', latitude: 45.8566, longitude: 9.3977 },
  { slug: 'lodi', name: 'Lodi', province: 'LO', region: 'Lombardia', latitude: 45.3142, longitude: 9.5034 },
  { slug: 'sondrio', name: 'Sondrio', province: 'SO', region: 'Lombardia', latitude: 46.1712, longitude: 9.8728 },
  { slug: 'busto-arsizio', name: 'Busto Arsizio', province: 'VA', region: 'Lombardia', latitude: 45.612, longitude: 8.8519 },
  { slug: 'legnano', name: 'Legnano', province: 'MI', region: 'Lombardia', latitude: 45.5966, longitude: 8.9161 },
  { slug: 'cinisello-balsamo', name: 'Cinisello Balsamo', province: 'MI', region: 'Lombardia', latitude: 45.5586, longitude: 9.2155 },
  // Trentino-Alto Adige
  { slug: 'trento', name: 'Trento', province: 'TN', region: 'Trentino-Alto Adige', latitude: 46.0667, longitude: 11.1211 },
  { slug: 'bolzano', name: 'Bolzano', province: 'BZ', region: 'Trentino-Alto Adige', latitude: 46.4983, longitude: 11.3548 },
  // Veneto
  { slug: 'vicenza', name: 'Vicenza', province: 'VI', region: 'Veneto', latitude: 45.5455, longitude: 11.5354 },
  { slug: 'treviso', name: 'Treviso', province: 'TV', region: 'Veneto', latitude: 45.6669, longitude: 12.243 },
  { slug: 'rovigo', name: 'Rovigo', province: 'RO', region: 'Veneto', latitude: 45.0703, longitude: 11.7904 },
  { slug: 'belluno', name: 'Belluno', province: 'BL', region: 'Veneto', latitude: 46.1408, longitude: 12.2156 },
  // Friuli-Venezia Giulia
  { slug: 'udine', name: 'Udine', province: 'UD', region: 'Friuli-Venezia Giulia', latitude: 46.0637, longitude: 13.2446 },
  { slug: 'pordenone', name: 'Pordenone', province: 'PN', region: 'Friuli-Venezia Giulia', latitude: 45.9569, longitude: 12.6605 },
  { slug: 'gorizia', name: 'Gorizia', province: 'GO', region: 'Friuli-Venezia Giulia', latitude: 45.9402, longitude: 13.6219 },
  // Emilia-Romagna
  { slug: 'piacenza', name: 'Piacenza', province: 'PC', region: 'Emilia-Romagna', latitude: 45.0526, longitude: 9.693 },
  { slug: 'forli', name: 'Forlì', province: 'FC', region: 'Emilia-Romagna', latitude: 44.2227, longitude: 12.0407 },
  { slug: 'cesena', name: 'Cesena', province: 'FC', region: 'Emilia-Romagna', latitude: 44.1396, longitude: 12.2432 },
  { slug: 'imola', name: 'Imola', province: 'BO', region: 'Emilia-Romagna', latitude: 44.3534, longitude: 11.7141 },
  // Toscana
  { slug: 'pisa', name: 'Pisa', province: 'PI', region: 'Toscana', latitude: 43.7228, longitude: 10.4017 },
  { slug: 'lucca', name: 'Lucca', province: 'LU', region: 'Toscana', latitude: 43.843, longitude: 10.5079 },
  { slug: 'arezzo', name: 'Arezzo', province: 'AR', region: 'Toscana', latitude: 43.4633, longitude: 11.8796 },
  { slug: 'pistoia', name: 'Pistoia', province: 'PT', region: 'Toscana', latitude: 43.9333, longitude: 10.9167 },
  { slug: 'siena', name: 'Siena', province: 'SI', region: 'Toscana', latitude: 43.3188, longitude: 11.3308 },
  { slug: 'grosseto', name: 'Grosseto', province: 'GR', region: 'Toscana', latitude: 42.7635, longitude: 11.1126 },
  { slug: 'massa', name: 'Massa', province: 'MS', region: 'Toscana', latitude: 44.0366, longitude: 10.1415 },
  { slug: 'carrara', name: 'Carrara', province: 'MS', region: 'Toscana', latitude: 44.0784, longitude: 10.1006 },
  // Umbria
  { slug: 'terni', name: 'Terni', province: 'TR', region: 'Umbria', latitude: 42.5641, longitude: 12.6453 },
  { slug: 'foligno', name: 'Foligno', province: 'PG', region: 'Umbria', latitude: 42.9561, longitude: 12.7036 },
  // Marche
  { slug: 'ancona', name: 'Ancona', province: 'AN', region: 'Marche', latitude: 43.6158, longitude: 13.5189 },
  { slug: 'pesaro', name: 'Pesaro', province: 'PU', region: 'Marche', latitude: 43.9102, longitude: 12.9133 },
  { slug: 'fano', name: 'Fano', province: 'PU', region: 'Marche', latitude: 43.843, longitude: 13.0195 },
  { slug: 'ascoli-piceno', name: 'Ascoli Piceno', province: 'AP', region: 'Marche', latitude: 42.855, longitude: 13.5756 },
  { slug: 'macerata', name: 'Macerata', province: 'MC', region: 'Marche', latitude: 43.3002, longitude: 13.4534 },
  { slug: 'fermo', name: 'Fermo', province: 'FM', region: 'Marche', latitude: 43.1611, longitude: 13.7183 },
  // Lazio
  { slug: 'latina', name: 'Latina', province: 'LT', region: 'Lazio', latitude: 41.4676, longitude: 12.9037 },
  { slug: 'frosinone', name: 'Frosinone', province: 'FR', region: 'Lazio', latitude: 41.6417, longitude: 13.3514 },
  { slug: 'viterbo', name: 'Viterbo', province: 'VT', region: 'Lazio', latitude: 42.4174, longitude: 12.1047 },
  { slug: 'rieti', name: 'Rieti', province: 'RI', region: 'Lazio', latitude: 42.4043, longitude: 12.8628 },
  { slug: 'guidonia-montecelio', name: 'Guidonia Montecelio', province: 'RM', region: 'Lazio', latitude: 41.9961, longitude: 12.7258 },
  { slug: 'fiumicino', name: 'Fiumicino', province: 'RM', region: 'Lazio', latitude: 41.7679, longitude: 12.2294 },
  // Abruzzo
  { slug: 'pescara', name: 'Pescara', province: 'PE', region: 'Abruzzo', latitude: 42.4618, longitude: 14.2161 },
  { slug: 'laquila', name: "L'Aquila", province: 'AQ', region: 'Abruzzo', latitude: 42.3498, longitude: 13.3995 },
  { slug: 'chieti', name: 'Chieti', province: 'CH', region: 'Abruzzo', latitude: 42.351, longitude: 14.1675 },
  { slug: 'teramo', name: 'Teramo', province: 'TE', region: 'Abruzzo', latitude: 42.6589, longitude: 13.7044 },
  // Molise
  { slug: 'campobasso', name: 'Campobasso', province: 'CB', region: 'Molise', latitude: 41.5603, longitude: 14.6627 },
  { slug: 'isernia', name: 'Isernia', province: 'IS', region: 'Molise', latitude: 41.5967, longitude: 14.2342 },
  // Campania
  { slug: 'caserta', name: 'Caserta', province: 'CE', region: 'Campania', latitude: 41.0742, longitude: 14.3323 },
  { slug: 'avellino', name: 'Avellino', province: 'AV', region: 'Campania', latitude: 40.9146, longitude: 14.7906 },
  { slug: 'benevento', name: 'Benevento', province: 'BN', region: 'Campania', latitude: 41.1307, longitude: 14.7818 },
  { slug: 'giugliano-in-campania', name: 'Giugliano in Campania', province: 'NA', region: 'Campania', latitude: 40.9298, longitude: 14.1951 },
  // Puglia
  { slug: 'lecce', name: 'Lecce', province: 'LE', region: 'Puglia', latitude: 40.3548, longitude: 18.1724 },
  { slug: 'brindisi', name: 'Brindisi', province: 'BR', region: 'Puglia', latitude: 40.6327, longitude: 17.9418 },
  { slug: 'barletta', name: 'Barletta', province: 'BT', region: 'Puglia', latitude: 41.3197, longitude: 16.2828 },
  { slug: 'andria', name: 'Andria', province: 'BT', region: 'Puglia', latitude: 41.2263, longitude: 16.2995 },
  { slug: 'trani', name: 'Trani', province: 'BT', region: 'Puglia', latitude: 41.2727, longitude: 16.4172 },
  // Basilicata
  { slug: 'potenza', name: 'Potenza', province: 'PZ', region: 'Basilicata', latitude: 40.6404, longitude: 15.8056 },
  { slug: 'matera', name: 'Matera', province: 'MT', region: 'Basilicata', latitude: 40.6664, longitude: 16.6043 },
  // Calabria
  { slug: 'catanzaro', name: 'Catanzaro', province: 'CZ', region: 'Calabria', latitude: 38.9098, longitude: 16.5877 },
  { slug: 'cosenza', name: 'Cosenza', province: 'CS', region: 'Calabria', latitude: 39.3088, longitude: 16.2514 },
  { slug: 'crotone', name: 'Crotone', province: 'KR', region: 'Calabria', latitude: 39.0808, longitude: 17.1274 },
  { slug: 'vibo-valentia', name: 'Vibo Valentia', province: 'VV', region: 'Calabria', latitude: 38.6756, longitude: 16.1011 },
  // Sicilia
  { slug: 'siracusa', name: 'Siracusa', province: 'SR', region: 'Sicilia', latitude: 37.0755, longitude: 15.2866 },
  { slug: 'trapani', name: 'Trapani', province: 'TP', region: 'Sicilia', latitude: 38.0176, longitude: 12.5366 },
  { slug: 'agrigento', name: 'Agrigento', province: 'AG', region: 'Sicilia', latitude: 37.311, longitude: 13.5765 },
  { slug: 'ragusa', name: 'Ragusa', province: 'RG', region: 'Sicilia', latitude: 36.9269, longitude: 14.7307 },
  { slug: 'caltanissetta', name: 'Caltanissetta', province: 'CL', region: 'Sicilia', latitude: 37.4922, longitude: 14.0625 },
  { slug: 'enna', name: 'Enna', province: 'EN', region: 'Sicilia', latitude: 37.5674, longitude: 14.2792 },
  { slug: 'marsala', name: 'Marsala', province: 'TP', region: 'Sicilia', latitude: 37.7981, longitude: 12.4346 },
  { slug: 'gela', name: 'Gela', province: 'CL', region: 'Sicilia', latitude: 37.0664, longitude: 14.2518 },
  // Sardegna
  { slug: 'sassari', name: 'Sassari', province: 'SS', region: 'Sardegna', latitude: 40.7259, longitude: 8.5556 },
  { slug: 'nuoro', name: 'Nuoro', province: 'NU', region: 'Sardegna', latitude: 40.3207, longitude: 9.3288 },
  { slug: 'oristano', name: 'Oristano', province: 'OR', region: 'Sardegna', latitude: 39.9064, longitude: 8.5922 },
  { slug: 'olbia', name: 'Olbia', province: 'SS', region: 'Sardegna', latitude: 40.9234, longitude: 9.4975 },
  { slug: 'quartu-sant-elena', name: "Quartu Sant'Elena", province: 'CA', region: 'Sardegna', latitude: 39.2417, longitude: 9.1842 },
]

export function formatCityFromSlug(slug: string): string {
  const cleanSlug = decodeURIComponent(slug).replace(/[\[\]]/g, '').trim().toLowerCase()
  const match = POPULAR_CITIES.find((c) => c.slug === cleanSlug)
  if (match) return match.name

  // Fallback: capitalize words from slug, e.g. "san-donato-milanese" -> "San Donato Milanese"
  return cleanSlug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

