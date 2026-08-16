```md
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rifornio — Agent Instructions

## Project identity

Public product name: Rifornio

Public domain:

https://rifornio.it

Technical names may still use the old Fuel Smart / smart-fuel naming:

- local repository folder: fuel-smart
- package name: fuel-smart
- GitHub repository: Frappao/smart-fuel
- Vercel project: smart-fuel
- main branch: main

Do not rename technical identifiers only for branding consistency unless there is a concrete technical reason.

Public claim:

“Fai rifornimento dove conviene davvero.”

## Product goal

Rifornio determines which fuel station is actually worth reaching.

The ranking must consider both:

- fuel price;
- fuel consumed to reach the station.

The core calculation is:

litersPurchased = refuelAmount / pricePerLiter

travelFuelLiters =
  travelDistanceKm * consumptionLitersPer100Km / 100

netFuelLiters =
  litersPurchased - travelFuelLiters

The station with the highest netFuelLiters wins.

Do not replace this ranking with sorting by price, geographic distance, or nominal cost.

## Supported product behavior

Current product supports:

- Benzina
- Gasolio
- GPL
- Self
- Servito

Backend MIMIT fuel values must remain:

- Benzina
- Gasolio
- GPL

Do not use “Diesel” as a backend fuel value.

Self maps to:

isSelf = true

Servito maps to:

isSelf = false

## Core architecture

WEB:

Next.js App Router
→ browser geolocation
→ Rifornio APIs
→ Supabase/PostGIS
→ Google Routes server-side
→ shared ranking
→ web results

MOBILE:

React + Vite under mobile/
→ Capacitor
→ native geolocation
→ HTTPS API at https://rifornio.it
→ existing web backend
→ shared ranking
→ mobile results
→ external Maps navigation

The Next.js application remains both the website and backend.

The mobile app must not contain backend secrets.

## Current stack

Do not replace the stack unless strictly necessary.

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Supabase
- PostgreSQL
- PostGIS
- Vitest
- Testing Library
- jsdom
- Google Routes API
- Capacitor
- Vite
- Git
- Vercel

## Data pipeline

Official station and fuel-price data comes from MIMIT Open Data.

Relevant implementation lives under:

lib/mimit/

The existing pipeline already:

- downloads official CSV files;
- parses stations and fuel prices;
- imports stations first;
- imports fuel prices second;
- works in batches;
- upserts records;
- removes obsolete records only after successful imports.

Do not rebuild this pipeline without a verified bug.

## Daily MIMIT import

The daily import is now automated.

Relevant files:

- app/api/cron/import-mimit/route.ts
- app/api/cron/import-mimit/route.test.ts
- vercel.json

The Vercel Cron schedule is:

0 8 * * *

The route is:

GET /api/cron/import-mimit

The route is protected using the server-side environment variable:

CRON_SECRET

Vercel sends:

Authorization: Bearer <CRON_SECRET>

Never commit CRON_SECRET.

The production Vercel project currently has a Function Max Duration of 300 seconds.

A real complete MIMIT import was tested successfully and took about 76 seconds.

Latest verified real import totals were approximately:

- 23,961 stations
- 93,108 fuel-price records
- 0 skipped fuel prices

Do not manually change database fuel prices.

## Geographic filtering and routing

PostGIS is only a geographic pre-filter.

Required architecture:

all stations
→ PostGIS nearby pre-filter
→ maximum 20 candidates
→ Google Routes
→ ranking

Do not use PostGIS straight-line distance as the final travel distance.

Route Matrix mapping must preserve candidate order and associate results using destinationIndex.

Do not associate Google route results using names or coordinates.

For the current nearby-station calculation:

travelDistanceKm =
  (distanceMeters / 1000) * 2

Current MVP assumption:

return trip ≈ outbound trip

## Shared ranking

Relevant file:

lib/calculation/rankNearbyStations.ts

Responsibilities include:

- candidate validation;
- destination order preservation;
- destinationIndex mapping;
- exclusion of individual missing routes;
- round-trip distance;
- calculateConvenience();
- descending netFuelLiters ordering;
- station display names.

Do not duplicate this logic unnecessarily in web or mobile components.

## Google Routes

Google Routes Compute Route Matrix is server-side only.

The Google Maps API key must never be exposed to:

- browser code;
- mobile bundle;
- Git;
- screenshots;
- client-side environment variables.

Current route:

POST /api/route-matrix

Maximum destinations:

20

The production endpoint is protected by a Vercel WAF rate limit.

Do not remove or bypass that protection without an explicit task.

## Supabase

Server access is implemented through:

lib/supabase/server.ts

It uses:

- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SECRET_KEY

SUPABASE_SECRET_KEY is server-only.

Never expose it to client code or mobile code.

PostGIS and the nearby_stations RPC are already implemented and working.

Do not redesign them without a verified reason.

## Web state

The production website is functional at:

https://rifornio.it

Existing public pages include:

- /
- /come-funziona
- /privacy
- /cookie
- /supporto

SEO currently includes:

- metadata;
- canonical URLs;
- sitemap;
- robots.txt.

Relevant files:

- app/sitemap.ts
- app/robots.ts

The support page currently uses a temporary public support email.

Do not silently replace contact details without checking the current requested address.

## AdSense

AdSense is not yet serving real ads.

ads.txt exists at:

https://rifornio.it/ads.txt

Relevant file:

public/ads.txt

Do not activate advertising code without checking:

- AdSense approval;
- consent requirements;
- privacy/cookie disclosures;
- actual runtime behavior.

Advertising must never affect organic station ranking.

## Analytics

Google Analytics 4 is integrated on the website using consent.

Relevant file:

components/analytics/AnalyticsConsent.tsx

Do not move, rename, or recreate this file without reason.

Important:

The correct folder is exactly:

components/analytics/

Do not create a folder named:

components/analytics /

with a trailing space.

The GA4 implementation was manually verified in production.

Do not rewrite the gtag wrapper unless there is a verified bug.

## Android app

Android application ID:

it.rifornio.app

App name:

Rifornio

The Android debug app currently supports:

- native geolocation;
- real nearby-station calculation;
- Google route-based ranking;
- external Maps navigation.

Native position behavior:

- requested only when the user submits;
- no watchPosition;
- no background location;
- no application-level location history.

Android permissions currently include:

- INTERNET
- ACCESS_COARSE_LOCATION
- ACCESS_FINE_LOCATION

Do not add background location without an explicit product requirement.

## Google Play status

Current focus is Google Play Store, not App Store.

The Play developer account exists.

The current blocker is physical Android-device verification.

No Play Store release has been uploaded yet.

Still pending include:

- device verification;
- final Data Safety submission;
- final privacy review for Android;
- final icon/splash;
- store screenshots;
- release signing;
- Android App Bundle;
- closed testing;
- production access.

Do not start iOS release work unless explicitly requested.

## Data Safety working conclusions

The Android app uses approximate and precise location for app functionality.

The position leaves the device to perform the requested service.

Current working Data Safety classification:

Approximate location:
- collected: yes
- shared: yes
- purpose: app functionality

Precise location:
- collected: yes
- shared: yes
- purpose: app functionality

Do not finalize policy declarations purely from assumptions.

Always verify current Google Play wording and provider behavior before submission.

## Features not to implement yet

Do not implement these unless explicitly requested:

- login/account;
- saved vehicles;
- history;
- favorites;
- social features;
- notifications;
- native maps;
- route-based commuter feature;
- additional monetization features;
- unrelated architectural refactors.

The future route-based commuter feature is plausible, but it is post-MVP.

## Git rules

Before any code change:

1. run git status;
2. inspect the actual relevant files;
3. make the smallest reasonable change.

Do not assume the working tree is clean.

Do not commit or push automatically unless explicitly requested.

Main branch:

main

Production deploys automatically from pushes to main.

## Development workflow

Work one micro-task at a time.

Before editing:

- understand the current implementation;
- inspect existing code;
- avoid rewriting working code;
- avoid introducing new dependencies unless necessary.

After meaningful changes run the relevant checks.

Common checks:

npx tsc --noEmit

Targeted ESLint:

npx eslint <changed-files>

Diff validation:

git diff --check

Tests:

npx vitest run <relevant-test-file>

Full suite when appropriate:

npm test

Build when appropriate:

npm run build

Mobile build when appropriate:

npm run mobile:build

Do not consider a task complete merely because it compiles.

## Integration tests

Some real integration tests are guarded by environment variables.

Examples:

RUN_SUPABASE_INTEGRATION
RUN_GOOGLE_ROUTES_INTEGRATION
RUN_MIMIT_INTEGRATION
RUN_FULL_MIMIT_IMPORT

A full real MIMIT import can be executed with:

RUN_FULL_MIMIT_IMPORT=1 npx vitest run lib/mimit/importMimitData.integration.test.ts

This writes to the configured Supabase database and performs cleanup.

Do not run it casually or against an unknown environment.

## Secrets

Never commit or expose:

- SUPABASE_SECRET_KEY
- GOOGLE_MAPS_API_KEY
- CRON_SECRET
- private tokens
- .env.local
- .env.test

Public identifiers such as GA4 Measurement IDs and AdSense publisher IDs are not secrets, but still avoid unnecessary duplication.

## Operational rules for Codex

Act as a careful implementation agent, not as a greenfield architect.

When receiving a task:

1. inspect git status;
2. inspect the relevant files;
3. explain the smallest change required;
4. modify as few files as possible;
5. preserve existing behavior unless the task explicitly changes it;
6. run targeted tests;
7. run TypeScript and lint when relevant;
8. run git diff --check;
9. summarize exactly what changed;
10. do not commit or push unless explicitly requested.

Do not:

- replace working architecture;
- rename technical identifiers for aesthetics;
- expose secrets;
- add dependencies without justification;
- perform speculative refactors;
- silently change ranking behavior;
- make legal/privacy claims without verified support.

## Current project checkpoint

Current production state:

- website deployed and functional;
- homepage indexed;
- sitemap active;
- robots.txt active;
- ads.txt active;
- GA4 active with consent;
- AdSense still pending;
- support page exists;
- Android debug app functional;
- Google Routes integration functional;
- MIMIT daily import automated through Vercel Cron;
- no Google Play release uploaded yet.

Immediate priority remains completing the Android / Google Play publication path once a physical Android device is available.

Until then, prefer small reliability, data-quality, documentation, and release-readiness tasks over new product scope.
```
