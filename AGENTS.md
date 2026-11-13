<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rifornio — Agent Instructions

Last reviewed: 2026-11-11. When something here disagrees with the code or the
database, trust the code/database and update this file.

## Project identity

- Public product name: **Rifornio** — https://rifornio.it
- Claim: “Fai rifornimento dove conviene davvero.”
- Technical names still use the old Fuel Smart / smart-fuel naming: package
  `fuel-smart`, GitHub `Frappao/smart-fuel`, Vercel project `smart-fuel`,
  Supabase project `fuel-smart`, branch `main`.
- Do not rename technical identifiers only for branding.

## Product goal and core ranking

Rifornio finds the station that is actually worth reaching, considering both
the fuel price and the fuel burned to get there.

```
litersPurchased  = refuelAmount / pricePerLiter
travelFuelLiters = travelDistanceKm * consumptionLitersPer100Km / 100
netFuelLiters    = litersPurchased - travelFuelLiters
```

The station with the highest `netFuelLiters` wins (on ties, the nearer one).
Never replace this with sorting by price, geographic distance or nominal cost.

- Nearby search: `travelDistanceKm = (distanceMeters / 1000) * 2`
  (MVP assumption: return trip ≈ outbound trip).
- Route search: subtract only the fuel for the extra road detour compared with
  the base origin → destination route.

Shared logic (do not duplicate in web or mobile components):

- `lib/calculation/calculateConvenience.ts`
- `lib/calculation/rankNearbyStations.ts` — candidate validation, order
  preservation, `destinationIndex` mapping, per-candidate missing routes,
  round trip, descending `netFuelLiters`, display names.
- `lib/calculation/rankStationsAlongRoute.ts` — route/detour ranking.

## Fuels and service

- UI: Benzina, Gasolio, GPL; Self / Servito.
- Backend MIMIT values must stay `Benzina`, `Gasolio`, `GPL` (never `Diesel`).
- Self → `isSelf = true`; Servito → `isSelf = false`.
- See `lib/fuels/supportedFuelTypes.ts`.

## Stack

Node.js ≥ 20 (24 supported), npm, Next.js 16 App Router, React 19, TypeScript,
Tailwind CSS 4, `motion` (animations), Three.js (3D simulator), Supabase
(Postgres 17 + PostGIS, Auth), Mapbox (Geocoding, Directions, Matrix),
Vitest + Testing Library + jsdom, Capacitor 8 + Vite 8 (mobile), Vercel
(region `fra1`), `@vercel/analytics`.

Do not replace the stack or add dependencies without a concrete reason.

## Architecture

```
WEB     Next.js App Router → browser geolocation (or typed address)
        → Rifornio API routes → Supabase/PostGIS pre-filter (≤ 20 candidates)
        → Mapbox Matrix (server-side) → shared ranking → results

MOBILE  React + Vite in mobile/ → Capacitor → native geolocation
        → HTTPS API at https://rifornio.it → same backend and ranking
        → external navigation app
```

The Next.js app is both website and backend. The mobile app must never contain
backend secrets.

### Repository map

- `app/` — pages and API routes (`app/api/*/route.ts`).
- `components/` — web UI, grouped by area: `calculation` (main calculator,
  refuel form), `trip` (route search), `map` (results map), `account`
  (Supabase Auth, saved vehicles, account panel), `navigation` (“Apri con”
  picker), `cities`, `hero`, `3d`, `ads`, `analytics`, `share`,
  `mobile-promo`, `location`, `motion`, `ui`.
- `lib/` — logic: `calculation`, `mimit`, `maps` (Mapbox), `stations`,
  `supabase`, `vehicles`, `account`, `navigation`, `cities`, `fuels`,
  `location`, `api`, `analytics` (consent, UTM campaign, product events).
- `mobile/src/` — Capacitor app (calculator, trip, navigation, footer).
- `android/`, `ios/` — Capacitor native projects (focus is Android).
- `supabase/` — `schema.sql` and `migrations/`.
- `scripts/` — local MIMIT import and launchd installer.
- `docs/` — `google-play-release.md`, `vehicle-accounts.md`, `utm.md`
  (campaign link convention and event list).
- `reviews/` — local review notes (untracked).

## Pages

- `/` — calculator (“Vicino a me” / “Lungo un percorso”), results with
  full-width map and the winning station.
- `/prezzi-carburanti` and `/prezzi-carburanti/[citta]` — local SEO city pages
  (popular cities in `lib/cities/popularCities.ts`), with savings and daily
  price trend from `city_fuel_price_daily`.
- `/come-funziona`, `/il-progetto`, `/guide/distributore-piu-lontano`,
  `/guide/consumo-auto-convenienza`, `/esperienza-3d`.
- `/privacy`, `/cookie`, `/supporto`.
- SEO: metadata, canonical URLs, `app/sitemap.ts`, `app/robots.ts`,
  `app/opengraph-image.tsx`.

Support contact: the address shown on `/supporto`. Do not change contact
details without Francesco confirming the new address.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/nearby-stations` | PostGIS pre-filter (`nearby_stations` RPC) |
| `POST /api/route-matrix` | Mapbox Matrix, max 20 destinations |
| `POST /api/route-path` | Road route to the winner, display only, max 50 km straight-line |
| `POST /api/geocode` | Address search (Mapbox Geocoding) |
| `POST /api/trip-stations` | Stations along a route (`stations_along_route` RPC) |
| `GET /api/latest-price-update` | Fresh “Prezzi aggiornati al …” date (read in the browser, the homepage is ISR) |
| `GET /api/price-freshness` | Freshness check (72/96 h thresholds) |
| `GET /api/cron/import-mimit` | Daily MIMIT import (Vercel Cron) |
| `POST /api/app-waitlist` | App beta email signup |
| `POST /api/account/delete` | Deletes the user identified by their Supabase access token |

Rules:

- Route Matrix results are associated by `destinationIndex`, never by name or
  coordinates. PostGIS straight-line distance is never the final travel
  distance.
- Mapbox calls are server-side only. The production endpoints are protected by
  a Vercel WAF rate limit: do not remove or bypass it without an explicit task.
- `lib/maps/getRouteMatrix.ts` (Google Routes, `GOOGLE_MAPS_API_KEY`) is
  legacy, used only by integration/comparison tests. Production uses Mapbox.

## MIMIT data pipeline

Official data from MIMIT Open Data, code in `lib/mimit/`: download CSVs (30 s
timeout, 3 retries), parse, import stations then prices in batches, upsert,
remove obsolete rows only after a successful import. Do not rebuild it without
a verified bug. Never edit fuel prices in the database by hand.

Two import paths, both recorded in `public.import_runs`:

1. **Vercel Cron** — `GET /api/cron/import-mimit`, schedule `0 8 * * *` (UTC),
   protected by `CRON_SECRET` (`Authorization: Bearer …`), region `fra1`,
   max duration 300 s, `source = 'mimit'`. MIMIT drops TCP connections from
   Vercel functions (even in `fra1`) and from non-European IPs, but answers
   the Supabase database server (AWS eu-central-1). So
   `lib/mimit/downloadMimitCsv.ts` tries the direct download once and then
   falls back to the `public.fetch_mimit_csv(dataset)` RPC, which downloads
   the CSV from the database through the `http` extension. Do not remove this
   fallback: without it the cron cannot download. When the import succeeds it
   also calls `snapshot_city_fuel_prices` for the city trend.
2. **Mac launchd agent** (secondary fallback) — `scripts/install-mimit-launchd.sh` installs
   `it.rifornio.import-mimit`, which runs `npm run import:mimit:local` every
   30 minutes and at login. It imports only when the MIMIT CSV `Last-Modified`
   is newer than the last successful import (`lib/mimit/localImportSchedule.ts`);
   `FORCE_MIMIT_IMPORT=1` forces it. `source = 'mimit-mac'`, log in
   `~/Library/Logs/rifornio-import-mimit.log`. It does **not** take the city
   price snapshot.

MIMIT publishes prices as of 8:00 of the previous day, so the “stale prices”
warning starts at 72 hours. Typical import: ~24k stations, ~93k prices,
~76 s.

Vitest excludes `.claude/**`, otherwise worktrees run the local import once per
copy.

## Supabase

- Server: `lib/supabase/server.ts` (`NEXT_PUBLIC_SUPABASE_URL` +
  `SUPABASE_SECRET_KEY`, server-only, bypasses RLS).
- Browser: `lib/supabase/client.ts` (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`),
  used for Auth and the user's own `user_vehicles`.
- Calculation preferences of logged-in users live in auth user metadata
  (`lib/account/accountPreferences.ts`); anonymous users keep form values only
  in `localStorage` (`lib/vehicles/refuelPreferences.ts`).

### Schema and migrations

`supabase/schema.sql` is the idempotent bootstrap. Incremental files in
`supabase/migrations/`:

| Migration | Production (checked 2026-11-11) |
| --- | --- |
| `20260930_add_stations_along_route.sql` | applied |
| `202610210001_user_vehicles.sql` | applied |
| `202610230001_app_waitlist.sql` | applied (2026-11-11) |
| `202611080001_import_runs.sql` | applied |
| `202611100001_city_fuel_price_daily.sql` | applied |
| `202611110001_mimit_csv_relay.sql` | applied (2026-11-11) |

Migrations are applied manually (Supabase SQL Editor, in chronological order)
or with a linked Supabase CLI. Agents must not apply migrations or write to the
production database without an explicit request.

### RLS rules

- RLS enabled on every table.
- Server-only tables (`app_waitlist`, `import_runs`, `city_fuel_price_daily`):
  `revoke all … from public, anon, authenticated`; access only through API
  routes.
- User-owned tables (`user_vehicles`): policies on
  `(select auth.uid()) = user_id`.
- Reference tables (`stations`, `fuel_prices`): no writes from anon or
  authenticated, ever.

## Navigation

Users choose the navigation app with the “Apri con” picker
(`lib/navigation/navigationApps.ts`, `components/navigation/`), stored in
`localStorage` key `rifornio_navigation_app_v1` (same key in the app). Web:
Google Maps, Apple Maps, Waze (default Apple Maps on Apple devices, Google Maps
elsewhere). App: Google Maps and Waze, Apple Maps only on iOS. On trips only
Google Maps keeps the stop; Apple Maps and Waze go straight to the station.
External navigation is intentional: no native map SDK.

## Advertising

- One Adsterra 300×250 banner (`components/ads/AdSlot.tsx`), shown only when
  `NEXT_PUBLIC_ADS_ENABLED=true`, placed above the refuel form in
  `FuelSmartCalculator`.
- No other formats (Native, Popunder, Social Bar, Smartlink) and nothing
  between ranking results without an explicit product request.
- `public/ads.txt` exists; the official Adsterra record must come from the
  Adsterra dashboard — never invent it.
- Ads must never affect the ranking. Before touching ad code, check consent,
  privacy/cookie disclosures and runtime behavior.

## Analytics

- Google Analytics 4 with consent banner:
  `components/analytics/AnalyticsConsent.tsx` (folder name exactly
  `components/analytics/`, no trailing space). Do not rewrite the gtag wrapper
  without a verified bug. GA4 loads only after "Accetta Analytics" (basic
  Consent Mode v2: ad signals always denied, Google Signals off).
- Consent store: `lib/analytics/consent.ts` (localStorage
  `rifornio-analytics-consent`). "Preferenze cookie"
  (`components/analytics/CookiePreferencesButton.tsx`, in the home footer,
  `/cookie` and `/privacy`) reopens the banner; revoking sets
  `ga-disable-<id>`, updates consent to denied and deletes `_ga*` cookies.
- Product events go only through `trackEvent` in
  `lib/analytics/trackEvent.ts` (typed params, no coordinates, addresses,
  email or exact consumption): `search_performed`, `station_viewed`,
  `navigation_started`, `vehicle_set`, `app_download_click`,
  `app_waitlist_signup`, `share_calculation`. Never call `window.gtag`
  directly. Event list and UTM convention: `docs/utm.md`.
- Campaign: `lib/analytics/campaign.ts` keeps the first `utm_*` of the visit
  in memory (sessionStorage `rifornio_campaign_v1` only after consent) and
  passes it to GA4 as `page_location` when consent comes after a page change.
  `buildPlayStoreUrl()` adds the campaign as Google Play `referrer`.
- Vercel Web Analytics, cookieless:
  `components/analytics/VercelWebAnalytics.tsx`. `beforeSend` keeps only the
  path plus `condividi` and `utm_*` parameters. The consent banner governs
  only GA4. The current Vercel plan has no custom events and no UTM
  breakdown, so events are sent to GA4 only.
- The Android app has no analytics yet (`trackEvent` is a no-op there).
  Planned: Firebase Analytics with an in-app consent screen, before the first
  Google Play upload (update Data Safety accordingly).
- Any new browser storage or tracking must be reflected in `/privacy` and
  `/cookie`.

## Android app

- Application ID `it.rifornio.app`, name “Rifornio”.
- Supports native geolocation, nearby and trip ranking, custom origin,
  external navigation with app choice, privacy/support links.
- Location only on submit: no `watchPosition`, no background location, no
  location history.
- Permissions: `INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`
  (plus `<queries>` for navigation apps). No background location without an
  explicit product requirement.
- Release steps and store texts: `docs/google-play-release.md`.

### Google Play status

Focus is Google Play, not the App Store (do not start iOS release work unless
asked). Developer account exists; no release uploaded yet. Pending: physical
device verification, Data Safety, Android privacy review, store screenshots,
release signing, App Bundle, closed testing, production access.

Data Safety working classification: approximate and precise location collected
and shared, purpose app functionality. Verify current Google Play wording and
provider behavior before submitting; do not finalize from assumptions.

## Not in scope unless explicitly requested

- social or complex profile features (basic Auth, saved vehicles and account
  panel exist);
- native map SDK in the app;
- search history or favorites;
- push notifications;
- background location;
- new monetization or ad formats;
- unrelated architectural refactors.

## Development

```
npm run dev                 # http://localhost:3000
npm run build
npx tsc --noEmit
npm test                    # or: npx vitest run <file>
npx eslint <changed-files>
git diff --check
npm run mobile:build | mobile:sync | mobile:open:android
```

Integration tests run only with env flags: `RUN_SUPABASE_INTEGRATION`,
`RUN_GOOGLE_ROUTES_INTEGRATION`, `RUN_ROUTE_PROVIDERS_COMPARISON`,
`RUN_ROUTE_TRIP_INTEGRATION`, `RUN_ROUTE_TRIP_AUDIT`,
`RUN_MIMIT_INTEGRATION`, `RUN_FULL_MIMIT_IMPORT`, `RUN_LOCAL_MIMIT_IMPORT`.
`RUN_FULL_MIMIT_IMPORT` and `RUN_LOCAL_MIMIT_IMPORT` write to the configured
Supabase database: never run them casually or against an unknown environment.

## Secrets

Never commit, print or expose: `SUPABASE_SECRET_KEY`, `MAPBOX_ACCESS_TOKEN`,
`GOOGLE_MAPS_API_KEY`, `CRON_SECRET`, `.env.local`, `.env.test`, `.vercel/`,
Android keystores and `keystore.properties`. Use `.env.example` to know which
variables exist. Public IDs (GA4, ad placements) are not secrets but avoid
duplicating them.

## Working rules for agents

1. `git status` first; never assume a clean tree.
2. Read the relevant files before changing them.
3. Make the smallest reasonable change; preserve behavior unless the task
   changes it.
4. Run targeted tests, `tsc`, ESLint on changed files, `git diff --check`.
   Compiling is not done.
5. Summarize exactly what changed.
6. Commit or push only when asked. A push to `main` deploys to production.

Do not replace working architecture, rename identifiers for aesthetics, add
speculative refactors, silently change ranking behavior, or make legal/privacy
claims without verified support.

## Current priorities

1. Android physical device verification for the Google Play account.
2. Make the city price snapshot run also after a successful Mac import (today
   only the Vercel cron takes it; since 2026-11-11 it downloads through the
   database, so this matters only on days when the cron fails).

Otherwise prefer small reliability, data-quality, documentation and
release-readiness tasks over new product scope.
