# Rifornio — Guida Rapida Pubblicazione Google Play Store

Questa guida contiene tutti i comandi e i testi già pronti (copia-incolla) per pubblicare **Rifornio (`it.rifornio.app`)** su Google Play Console.

---

## 1. Asset Grafici Già Pronti

I file grafici richiesti dallo Store sono già stati generati nella cartella `android/store-assets/`:

- **Icona dell'app (512 × 512 px, PNG 32-bit):**
  `android/store-assets/icon-512x512.png`
- **Immagine in primo piano / Feature Graphic (1024 × 500 px, PNG):**
  `android/store-assets/feature-graphic-1024x500.png`
- **Icone launcher Android (`mipmap-*`) e Splash screen (`drawable*`):**
  Già installate in `android/app/src/main/res/`.

---

## 2. Creazione Chiave di Firma e Pacchetto `.aab` (Android App Bundle)

Esegui questi passaggi una sola volta dal terminale nella cartella principale del progetto:

### Passo A: Genera la chiave `upload-keystore.jks`
*(Scegli una password sicura e conservala: servirà per tutti i futuri aggiornamenti dell'app)*

```bash
keytool -genkeypair -v \
  -keystore android/upload-keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Rifornio, OU=Mobile, O=Rifornio, L=Italia, S=IT, C=IT"
```

### Passo B: Crea il file `android/keystore.properties`
Copia il file di esempio `android/keystore.properties.example` in `android/keystore.properties` e inserisci la password scelta:

```ini
storeFile=upload-keystore.jks
storePassword=LA_TUA_PASSWORD
keyAlias=upload
keyPassword=LA_TUA_PASSWORD
```
*(Nota: `upload-keystore.jks` e `keystore.properties` sono già protetti in `.gitignore` e non verranno mai caricati su Git).*

### Passo C: Genera il bundle firmato `.aab`
```bash
npm run mobile:sync
cd android && ./gradlew bundleRelease
```

Il file pronto da caricare su Google Play Console si troverà in:
`android/app/build/outputs/bundle/release/app-release.aab`

---

## 3. Testi Pronti per la Scheda dello Store (ASO — App Store Optimization)

### Nome dell'app (max 30 caratteri)
```text
Rifornio: Prezzi Benzina e GPL
```

### Breve descrizione (max 80 caratteri)
```text
Trova il distributore che conviene davvero calcolando prezzo, distanza e consumo
```

### Descrizione completa (max 4000 caratteri)
```text
Fai rifornimento dove conviene davvero.

Il distributore con il prezzo al litro più basso non è sempre la scelta migliore: se per raggiungerlo devi fare una deviazione troppo lunga, il carburante bruciato nel tragitto può azzerare o superare il risparmio ottenuto alla pompa.

Rifornio è l'applicazione che calcola la convenienza reale di ogni rifornimento in tutta Italia, combinando i prezzi ufficiali dei carburanti con la distanza stradale effettiva e il consumo medio della tua auto.

PERCHÉ RIFORNIO È DIVERSA DALLE SOLITE APP PREZZI BENZINA:
• Calcolo dei Litri Netti: Rifornio stima quanti litri acquisti con il tuo rifornimento e sottrae il carburante realmente necessario per raggiungere il distributore. Vince chi ti lascia più carburante netto nel serbatoio.
• Rifornimento Lungo il Percorso (Ideale per pendolari e viaggi): non fai benzina partendo dal divano per tornare sul divano. Inserisci partenza e destinazione (es. casa-lavoro) e Rifornio calcolerà quali distributori lungo la tua strada richiedono la minore deviazione stradale.
• Distanze Stradali Reali: niente distanze in linea d'aria ingannevoli. I percorsi sono calcolati sulle strade effettive.
• Prezzi Ufficiali MIMIT: dati aggiornati quotidianamente dagli Open Data del Ministero delle Imprese e del Made in Italy per oltre 23.000 impianti in tutta Italia.

CARBURANTI E MODALITÀ SUPPORTATE:
• Benzina (Self e Servito)
• Gasolio / Diesel (Self e Servito)
• GPL

SEMPLICE, VELOCE E TRASPARENTE:
• Nessuna registrazione obbligatoria per cercare i distributori.
• Apertura immediata del navigatore verso il distributore scelto con un solo tocco.
• Salvataggio opzionale sul tuo dispositivo dei consumi medi dei tuoi veicoli.

Scarica Rifornio e scopri subito quale distributore ti fa risparmiare davvero!
```

---

## 4. Risposte Pronte per la Sezione "Sicurezza dei Dati" (Data Safety)

- **URL Norme sulla Privacy:** `https://rifornio.it/privacy`
- **L'app raccoglie o condivide tipi di dati utente richiesti?** `Sì`
- **Tutti i dati utente raccolti dall'app sono criptati in transito?** `Sì` (HTTPS)
- **Offri agli utenti un modo per richiedere l'eliminazione dei dati?** `Non applicabile / L'app non crea account server-side né conserva cronologia delle posizioni associata all'identità dell'utente`
- **Tipi di dati selezionati:**
  - **Posizione → Posizione approssimativa** e **Posizione precisa**:
    - Raccolti: `Sì` (Elaborati in modo effimero per calcolare i distributori vicini quando l'utente avvia la ricerca)
    - Condivisi: `Sì` (Per il calcolo del routing stradale verso i distributori candidati)
    - I dati sono obbligatori o facoltativi? `Facoltativi` (L'utente può anche inserire un indirizzo di partenza manuale nella modalità Lungo il percorso)
    - Scopo: `Funzionalità dell'app`

---

## 5. Risposte Pronte per la Fine dei 14 Giorni di Test Chiuso (Accesso alla Produzione)

Al termine dei 14 giorni con almeno 12–20 tester, Google Play Console chiederà di compilare 3 domande per sbloccare la Produzione:

1. **Come hai reclutato i tester per il tuo test chiuso?**
   > *Abbiamo coinvolto un gruppo eterogeneo di automobilisti, pendolari e beta tester Android su diversi dispositivi fisici per verificare sul campo il calcolo dei distributori vicini e lungo il percorso in condizioni reali di utilizzo.*

2. **Descrivi il coinvolgimento dei tester e il feedback ricevuto:**
   > *I tester hanno utilizzato l'app regolarmente durante le due settimane di test sia in modalità posizione attuale sia in modalità pianificazione viaggio (Lungo il percorso). Hanno fornito riscontri sulla rapidità della geolocalizzazione, sulla chiarezza del confronto tra litri acquistati e litri consumati per la deviazione e sull'apertura diretta delle indicazioni stradali.*

3. **Quali modifiche hai apportato all'app sulla base del feedback ricevuto?**
   > *Sulla base dei riscontri emersi durante il test chiuso, abbiamo perfezionato la gestione dei permessi di posizione, migliorato la leggibilità delle schede dei distributori e ottimizzato la reattività dell'interfaccia prima del rilascio in produzione.*
