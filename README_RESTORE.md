# Fuel Smart — guida di ripristino

## Architettura attuale

Fuel Smart usa Next.js con App Router e TypeScript. In questa fase il progetto
contiene la base applicativa, il motore matematico di convenienza e una pipeline
server-side che acquisisce i CSV ufficiali MIMIT, li converte in record tipizzati
e li importa in Supabase/PostgreSQL. Non sono ancora presenti UI finale,
geolocalizzazione, mappe, routing stradale o autenticazione.

La pipeline dati segue questo flusso:

1. download dei CSV ufficiali MIMIT;
2. parsing delle anagrafiche e dei prezzi;
3. conversione nei record PostgreSQL in formato `snake_case`;
4. upsert a batch delle stazioni e poi dei prezzi;
5. rimozione dei record non più presenti nella fonte, soltanto dopo un import
   completo riuscito.

## File principali

- `lib/calculation/calculateConvenience.ts`: calcola carburante acquistato,
  carburante consumato per il viaggio e carburante netto.
- `lib/mimit/constants.ts` e `lib/mimit/downloadCsv.ts`: URL ufficiali e download
  dei dataset.
- `lib/mimit/parseStationsCsv.ts` e `lib/mimit/parseFuelPricesCsv.ts`: parser puri
  dei CSV MIMIT.
- `lib/mimit/mapStationToDatabaseRow.ts` e
  `lib/mimit/mapFuelPriceToDatabaseRow.ts`: mapper verso le righe Supabase.
- `lib/mimit/importMimitStations.ts` e
  `lib/mimit/importMimitFuelPrices.ts`: importatori server-side con batching e
  cleanup sicuro.
- `lib/mimit/importMimitData.ts`: esegue prima l'import stazioni e, solo dopo il
  suo successo, l'import prezzi.
- `lib/supabase/client.ts`: client pubblico basato sulla publishable key.
- `lib/supabase/server.ts`: client riservato al server basato sulla secret key.
- `types/database.ts`: tipi applicativi per stazioni e prezzi.
- `supabase/schema.sql`: schema PostgreSQL idempotente da applicare manualmente.

## Configurazione delle variabili ambiente

Il file `.env.example` elenca le variabili richieste senza valori reali. Copialo
in `.env.local` per lo sviluppo Next.js:

```bash
cp .env.example .env.local
```

Per i test di integrazione crea anche `.env.test` con la stessa struttura:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Inserisci esclusivamente le credenziali del tuo progetto Supabase. `.env.local`
e `.env.test` sono ignorati da Git e non devono mai essere committati. La
`SUPABASE_SECRET_KEY` concede operazioni privilegiate: deve restare soltanto
server-side e non deve essere rinominata con il prefisso `NEXT_PUBLIC_`.

## Creazione dello schema Supabase

Se le tabelle non esistono già, apri il SQL Editor del progetto Supabase e
applica manualmente il contenuto di `supabase/schema.sql`. Il file crea le tabelle
`stations` e `fuel_prices`, la relazione con cancellazione a cascata, i vincoli di
unicità e gli indici necessari. Nessun test unitario applica automaticamente lo
schema. Gli import sample scrivono soltanto il sottoinsieme documentato; il full
import esegue anche il cleanup dei record obsoleti e va quindi avviato soltanto
manualmente e sul progetto Supabase corretto.

## Test

I test unitari, che non richiedono rete o credenziali, si eseguono normalmente:

```bash
npm test
```

Le suite esterne sono disattivate per default e vanno abilitate esplicitamente.

Per verificare soltanto download e parsing dei CSV MIMIT reali, senza scrivere su
Supabase:

```bash
RUN_MIMIT_INTEGRATION=1 npm test -- lib/mimit/mimit.integration.test.ts
```

Per la SELECT non distruttiva su Supabase e per gli import sample limitati a
cinque stazioni e dieci prezzi:

```bash
RUN_SUPABASE_INTEGRATION=1 npm test -- lib/supabase/supabase.integration.test.ts lib/mimit/importStationsSample.integration.test.ts lib/mimit/importFuelPricesSample.integration.test.ts
```

Il full import scarica e scrive tutti i dati MIMIT. Eseguilo manualmente solo dopo
avere verificato progetto, schema e credenziali Supabase:

```bash
RUN_FULL_MIMIT_IMPORT=1 npm test -- lib/mimit/importMimitData.integration.test.ts
```

Non usare il flag del full import durante i normali test locali o in CI.

## Prossimi step non ancora implementati

1. ricerca geografica dei distributori vicini;
2. PostGIS e distanza preliminare;
3. geolocalizzazione del browser;
4. integrazione con Google Routes API;
5. ranking completo della convenienza;
6. UI MVP.
