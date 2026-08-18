# Rifornio — guida di ripristino e configurazione su un nuovo computer

Questa guida serve per configurare il repository Rifornio su un nuovo computer senza perdere il contesto tecnico del progetto e senza trasferire secret tramite Git.

Il repository GitHub è:

`Frappao/smart-fuel`

Il branch principale è:

`main`

Il nome pubblico del prodotto è **Rifornio**. Alcuni identificatori tecnici mantengono ancora il vecchio nome Fuel Smart / smart-fuel e non devono essere rinominati solo per uniformità estetica.

---

## 1. Prerequisiti

Configurazione verificata sul computer di sviluppo principale:

- Node.js: `24.19.0`
- npm: `11.17.0`
- Git: `2.50.1`
- Java: Temurin JDK `21.0.12 LTS`

Non è necessario avere esattamente la stessa patch version di Git.

Per evitare differenze impreviste, usare preferibilmente Node 24 e Java 21.

Java 21 è necessario in particolare per la build Android corrente.

Se sul nuovo computer si lavora soltanto sul sito web, Android Studio e Java possono essere configurati in un secondo momento.

---

## 2. Clonare il repository

Clonare il repository:

```bash
git clone https://github.com/Frappao/smart-fuel.git
````

Entrare nella cartella:

```bash
cd smart-fuel
```

Controllare branch e stato:

```bash
git status -sb
git branch --show-current
git log -1 --oneline
```

Il branch deve essere:

```text
main
```

e il working tree deve essere pulito.

---

## 3. Installare le dipendenze

Installare le dipendenze usando il lockfile versionato:

```bash
npm install
```

Non eliminare o rigenerare `package-lock.json` senza una ragione tecnica reale.

Dopo l'installazione:

```bash
node -v
npm -v
```

---

## 4. Contesto per Codex

Il repository contiene:

```text
AGENTS.md
```

Questo file contiene il contesto operativo aggiornato per Codex:

* architettura;
* stato corrente;
* regole operative;
* ranking;
* MIMIT;
* Google Routes;
* Supabase;
* Android;
* Google Play;
* cron giornaliero;
* sicurezza e secret.

Quando si apre il repository su un nuovo computer, Codex deve leggere e rispettare `AGENTS.md`.

Non affidarsi esclusivamente alla cronologia di una vecchia sessione Codex.

Il repository e `AGENTS.md` sono la fonte persistente per riprendere il lavoro.

---

## 5. Variabili ambiente locali

Le credenziali reali non sono versionate.

Il file:

```text
.env.example
```

contiene soltanto i nomi delle variabili richieste:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_ADS_ENABLED=false
```

Creare il file locale:

```bash
cp .env.example .env.local
```

Poi inserire manualmente i valori reali.

Non copiare `.env.local` in:

* Git;
* GitHub;
* ChatGPT;
* Codex;
* screenshot;
* documentazione pubblica.

### Variabili

`NEXT_PUBLIC_SUPABASE_URL`

URL pubblico del progetto Supabase.

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Publishable key usata dove previsto dal client.

`SUPABASE_SECRET_KEY`

Secret server-side.

Non deve mai arrivare nel browser o nel bundle mobile.

`GOOGLE_MAPS_API_KEY`

Chiave usata server-side per Google Routes.

Non deve essere esposta al client.

`NEXT_PUBLIC_ADS_ENABLED`

Per lo stato corrente lasciare:

```dotenv
NEXT_PUBLIC_ADS_ENABLED=false
```

finché AdSense non viene attivato e verificato.

---

## 6. CRON_SECRET

La produzione utilizza anche:

```text
CRON_SECRET
```

per proteggere:

```text
GET /api/cron/import-mimit
```

Il valore reale è già configurato nelle Environment Variables di Vercel Production.

Normalmente non è necessario inserirlo in `.env.local`.

Non committare mai il valore.

---

## 7. Controllo iniziale del progetto

Dopo installazione e configurazione `.env.local`:

```bash
npx tsc --noEmit
```

Poi:

```bash
npm test
```

Poi:

```bash
npm run build
```

Se questi controlli sono verdi, la parte web è configurata correttamente.

---

## 8. Avviare il sito in locale

Avviare:

```bash
npm run dev
```

Aprire:

```text
http://localhost:3000
```

Il sito di produzione è:

```text
https://rifornio.it
```

---

## 9. Architettura dati

Rifornio usa:

* Supabase;
* PostgreSQL;
* PostGIS;
* Open Data MIMIT;
* Google Routes Compute Route Matrix.

La pipeline di ranking è:

```text
MIMIT
→ Supabase/PostGIS
→ massimo 20 candidati
→ Google Routes
→ calculateConvenience()
→ ranking
```

PostGIS è soltanto un pre-filtro geografico.

La distanza definitiva per il ranking deve essere stradale.

---

## 10. Formula di convenienza

Il calcolo principale è:

```text
litersPurchased = refuelAmount / pricePerLiter

travelFuelLiters =
  travelDistanceKm * consumptionLitersPer100Km / 100

netFuelLiters =
  litersPurchased - travelFuelLiters
```

Vince il distributore con `netFuelLiters` più alto.

Non sostituire questa logica con ordinamento per solo prezzo o distanza.

---

## 11. Import MIMIT

Gli importatori si trovano sotto:

```text
lib/mimit/
```

La pipeline completa:

1. scarica i CSV ufficiali;
2. importa le stazioni;
3. importa i prezzi;
4. esegue upsert a batch;
5. rimuove i record obsoleti soltanto dopo import riuscito.

Il full import reale può essere eseguito manualmente con:

```bash
RUN_FULL_MIMIT_IMPORT=1 npx vitest run lib/mimit/importMimitData.integration.test.ts
```

Attenzione:

questo comando scrive sul database Supabase configurato in `.env.local` ed esegue cleanup.

Non eseguirlo casualmente.

---

## 12. Import MIMIT giornaliero in produzione

L'import è automatizzato tramite Vercel Cron.

File:

```text
app/api/cron/import-mimit/route.ts
app/api/cron/import-mimit/route.test.ts
vercel.json
```

Schedule:

```text
0 8 * * *
```

Route:

```text
/api/cron/import-mimit
```

Il job usa `CRON_SECRET`.

La Function Max Duration configurata sul progetto Vercel è 300 secondi.

Un full import reale è stato verificato in circa 76 secondi.

---

## 13. Test di integrazione

Alcune suite reali sono disabilitate per default.

Variabili usate:

```text
RUN_SUPABASE_INTEGRATION
RUN_GOOGLE_ROUTES_INTEGRATION
RUN_MIMIT_INTEGRATION
RUN_FULL_MIMIT_IMPORT
```

Non abilitarle nei normali test se non si vuole chiamare servizi esterni o modificare il database.

---

## 14. Mobile Android

Il frontend mobile si trova in:

```text
mobile/
```

Il progetto Android nativo si trova in:

```text
android/
```

App ID:

```text
it.rifornio.app
```

App name:

```text
Rifornio
```

### Build frontend mobile

```bash
npm run mobile:build
```

### Sincronizzazione Capacitor Android

```bash
npx cap sync android
```

### Build APK debug

Entrare nella cartella:

```bash
cd android
```

Poi:

```bash
./gradlew assembleDebug
```

Usare Java 21.

APK risultante:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 15. Android Studio

Se sul nuovo computer si deve lavorare anche sulla parte Android:

1. installare Android Studio;
2. installare Android SDK compatibile;
3. configurare Java 21;
4. aprire il progetto Android tramite Capacitor o direttamente da `android/`.

Comando disponibile:

```bash
npm run mobile:open:android
```

Il progetto corrente usa Android API 36.

### SDK e adb sul computer di sviluppo principale

Configurazione verificata:

- Android SDK: `~/Library/Android/sdk`
- Java: Temurin JDK 21
- `ANDROID_HOME`: non impostato
- `ANDROID_SDK_ROOT`: non impostato
- `adb`: non presente globalmente nel `PATH`

`adb` può essere eseguito direttamente con:

```bash
~/Library/Android/sdk/platform-tools/adb
```
Sul nuovo computer non è necessario replicare esattamente questa configurazione: Android Studio può gestire il percorso SDK. Se si vuole usare `adb` direttamente dal terminale, aggiungere `platform-tools` al `PATH`.
---

## 16. iOS

La cartella:

```text
ios/
```

esiste già.

iOS non è attualmente il focus del progetto.

Non dedicare tempo alla configurazione Apple/Xcode finché non viene esplicitamente deciso di lavorare sulla release iOS.

---

## 17. Google Play

Stato corrente:

* account sviluppatore creato;
* app non ancora pubblicata;
* verifica dispositivo Android fisico ancora necessaria;
* nessuna release Play caricata;
* Data Safety in preparazione;
* closed testing non ancora iniziato.

Focus corrente:

```text
Google Play / Android
```

non App Store.

---

## 18. Web in produzione

Sono già funzionanti:

* homepage;
* calcolo reale;
* geolocalizzazione;
* ranking Google Routes;
* pagina Come funziona;
* Privacy;
* Cookie;
* Supporto;
* sitemap;
* robots.txt;
* ads.txt;
* GA4 con consenso.

Non ricostruire queste parti senza un bug reale.

---

## 19. Git e sicurezza

Prima di ogni modifica:

```bash
git status -sb
```

Dopo modifiche:

```bash
git diff --check
```

Usare test mirati quando possibile.

Non fare commit o push automaticamente senza una decisione esplicita.

Non committare:

* `.env.local`;
* `.env.test`;
* secret;
* chiavi API private;
* file di signing;
* keystore Android;
* credenziali.

Il `.gitignore` già protegge `.env*`, tranne `.env.example`.

---

## 20. Checklist nuovo computer

La configurazione è completa quando:

* [ ] repository clonato;
* [ ] branch `main`;
* [ ] working tree pulito;
* [ ] `npm install` completato;
* [ ] `.env.local` ricreato in modo sicuro;
* [ ] `npx tsc --noEmit` verde;
* [ ] `npm test` verde;
* [ ] `npm run build` verde;
* [ ] `npm run dev` avvia il sito;
* [ ] Codex riconosce `AGENTS.md`;
* [ ] Java 21 disponibile, se si lavora sul mobile;
* [ ] `npm run mobile:build` verde, se necessario;
* [ ] Android Studio configurato, se necessario.

---

## 21. Regola principale per il ripristino

Il repository GitHub è la fonte del codice.

`AGENTS.md` è la fonte persistente del contesto operativo per gli agenti.

I secret vanno trasferiti separatamente e mai tramite Git.

Se il repository, i test e le variabili ambiente sono corretti, non è necessario ricostruire manualmente database, architettura o pipeline già operative.
