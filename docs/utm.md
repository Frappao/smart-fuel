# Link con UTM: convenzione per canale

Questa guida serve per gli esperimenti di marketing: ogni canale ha un link
riconoscibile, così Google Analytics 4 (GA4) mostra quanti utenti porta e
quanti di loro fanno una ricerca o avviano la navigazione verso un
distributore.

## Come funziona in breve

- Si aggiungono al link alcuni parametri `utm_*` (per esempio
  `?utm_source=tiktok&utm_medium=social`).
- Rifornio legge questi parametri all'arrivo e li tiene per tutta la visita,
  anche se l'utente cambia pagina prima di accettare il banner Analytics
  (`lib/analytics/campaign.ts`). Vale il primo link della visita.
- GA4 associa la visita e le conversioni (ricerche, navigazioni, clic
  sull'app) a quel canale.
- Chi rifiuta Analytics non viene contato da GA4: i numeri per canale sono
  sempre una stima per difetto. Vercel Web Analytics conta tutte le visite,
  ma sul piano attuale non mostra il dettaglio per UTM.

## Regole

1. **Tutto minuscolo, senza spazi né accenti.** Le parole si separano con
   `_`. GA4 distingue maiuscole e minuscole: `TikTok` e `tiktok` diventerebbero
   due canali diversi.
2. **Non mettere mai UTM nei link interni** (da una pagina di rifornio.it a
   un'altra): cancellerebbero la provenienza vera e farebbero ripartire la
   sessione.
3. **Non mettere UTM sul traffico SEO.** Le visite da Google e dagli altri
   motori di ricerca si misurano da sole (canale "Organic Search" in GA4 e
   Google Search Console).
4. Usa sempre almeno `utm_source`, `utm_medium` e `utm_campaign`.

| Parametro      | Cosa indica                          | Esempi                                       |
| -------------- | ------------------------------------ | -------------------------------------------- |
| `utm_source`   | Dove sta il link                     | `tiktok`, `instagram`, `reddit`, `facebook`  |
| `utm_medium`   | Tipo di canale (vedi tabella sotto)  | `social`, `paid_social`, `email`, `referral` |
| `utm_campaign` | L'esperimento                        | `lancio_2026-11`, `prezzi_milano_2026-12`    |
| `utm_content`  | Il post, il video o il punto preciso | `bio`, `video_risparmio_01`, `r_italy`       |
| `utm_term`     | Solo per annunci a parole chiave     | `prezzo_benzina`                             |

Valori di `utm_medium` da usare (GA4 li riconosce e assegna da solo il canale
giusto nei report):

| `utm_medium`  | Quando                               | Canale in GA4  |
| ------------- | ------------------------------------ | -------------- |
| `social`      | Post, video, commenti, bio gratuiti  | Organic Social |
| `paid_social` | Post o video sponsorizzati           | Paid Social    |
| `email`       | Newsletter                           | Email          |
| `referral`    | Link da siti o partner               | Referral       |
| `affiliate`   | Partner pagati a commissione         | Affiliates     |

Per `utm_campaign` usa `tema_aaaa-mm` (per esempio `lancio_2026-11`): così gli
esperimenti si ordinano per data e restano confrontabili.

## Link pronti per canale

Sostituisci la campagna e il contenuto con quelli dell'esperimento. Come pagina
di arrivo va bene la home (`https://rifornio.it/`) oppure, per un pubblico
locale, la pagina di una città (`https://rifornio.it/prezzi-carburanti/milano`).

### seo

Nessun UTM. Si misura in GA4 (Acquisizione → canale "Organic Search") e in
Google Search Console (query, impressioni, clic, pagine).

### tiktok

```text
https://rifornio.it/?utm_source=tiktok&utm_medium=social&utm_campaign=lancio_2026-11&utm_content=bio
https://rifornio.it/?utm_source=tiktok&utm_medium=social&utm_campaign=lancio_2026-11&utm_content=video_risparmio_01
https://rifornio.it/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=lancio_2026-11&utm_content=spark_ads_01
```

### instagram

```text
https://rifornio.it/?utm_source=instagram&utm_medium=social&utm_campaign=lancio_2026-11&utm_content=bio
https://rifornio.it/?utm_source=instagram&utm_medium=social&utm_campaign=lancio_2026-11&utm_content=storia_link_01
https://rifornio.it/?utm_source=instagram&utm_medium=paid_social&utm_campaign=lancio_2026-11&utm_content=reel_01
```

### reddit

In `utm_content` metti il subreddit (`r_` + nome).

```text
https://rifornio.it/?utm_source=reddit&utm_medium=social&utm_campaign=lancio_2026-11&utm_content=r_italy
https://rifornio.it/prezzi-carburanti/milano?utm_source=reddit&utm_medium=social&utm_campaign=lancio_2026-11&utm_content=r_milano
```

### facebook_groups

`utm_source` resta `facebook` (così GA4 lo riconosce come social); il gruppo va
in `utm_content`.

```text
https://rifornio.it/?utm_source=facebook&utm_medium=social&utm_campaign=gruppi_2026-11&utm_content=gruppo_pendolari_milano
https://rifornio.it/prezzi-carburanti/roma?utm_source=facebook&utm_medium=social&utm_campaign=gruppi_2026-11&utm_content=gruppo_sei_di_roma
```

### partnership

`utm_source` è il nome del partner; `utm_medium` è `referral` (o `affiliate`
se il partner è pagato a commissione).

```text
https://rifornio.it/?utm_source=nome_partner&utm_medium=referral&utm_campaign=partnership_nome_partner_2026-11
https://rifornio.it/?utm_source=nome_partner&utm_medium=affiliate&utm_campaign=partnership_nome_partner_2026-11&utm_content=banner_home
```

### newsletter

`utm_source` è il nome della newsletter (la tua o quella di chi ti ospita);
`utm_campaign` è l'invio.

```text
https://rifornio.it/?utm_source=newsletter_rifornio&utm_medium=email&utm_campaign=invio_2026-11-20
https://rifornio.it/?utm_source=nome_newsletter_ospite&utm_medium=email&utm_campaign=ospite_2026-11&utm_content=link_principale
```

### Condivisione su WhatsApp (automatica)

Il pulsante "Condividi su WhatsApp" sotto ai risultati aggiunge già
`utm_source=whatsapp&utm_medium=social&utm_campaign=condivisione_risultato`:
non serve fare nulla.

## Link a Google Play (app Android)

Quando l'app sarà pubblica, i link verso Google Play portano il canale nel
parametro `referrer`, così la Play Console mostra le installazioni per
sorgente e campagna. Il valore di `referrer` va codificato (`=` diventa `%3D`,
`&` diventa `%26`).

```text
https://play.google.com/store/apps/details?id=it.rifornio.app&referrer=utm_source%3Dtiktok%26utm_medium%3Dsocial%26utm_campaign%3Dlancio_app_2026-12
https://play.google.com/store/apps/details?id=it.rifornio.app&referrer=utm_source%3Dnewsletter_rifornio%26utm_medium%3Demail%26utm_campaign%3Dlancio_app_2026-12
```

Dal sito, i link a Google Play vanno costruiti con `buildPlayStoreUrl()` in
`lib/analytics/campaign.ts`: chi è arrivato da un link con UTM porta con sé il
proprio canale; gli altri risultano `utm_source=rifornio.it&utm_medium=referral`.
Oggi il sito non ha ancora un link a Google Play (il pulsante "App" apre la
lista d'attesa della beta).

## Dove leggere i risultati in GA4

- **Utenti per canale:** Rapporti → Acquisizione → Acquisizione utenti
  (dimensione "Sorgente/mezzo prima interazione utente").
- **Visite per canale e campagna:** Rapporti → Acquisizione → Acquisizione
  traffico (dimensioni "Sorgente/mezzo sessione" e "Campagna sessione").
- **Utenti attivi per canale:** gli stessi rapporti, colonna degli eventi
  chiave `search_performed` e `navigation_started`, oppure un'esplorazione a
  imbuto `session_start` → `search_performed` → `navigation_started`
  suddivisa per "Sorgente/mezzo sessione".

## Eventi inviati a GA4

Tutti partono da `lib/analytics/trackEvent.ts` e solo dopo il consenso.

| Evento                | Quando                                                   | Parametri                                                               |
| --------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `search_performed`    | Arriva la classifica di una ricerca (anche vuota)        | `search_mode`, `fuel_type`, `service`, `results_count`, `city`          |
| `station_viewed`      | Si apre un distributore (mappa, lista, dettagli calcolo) | `search_mode`, `view_source`, `rank`, `city`, `brand`                   |
| `navigation_started`  | Clic su "Portami qui" / "Apri nel navigatore"            | `search_mode`, `navigation_app`, `rank`, `city`, `brand`                |
| `vehicle_set`         | Consumo nuovo o cambiato alla ricerca, auto salvata      | `vehicle_source`, `fuel_type`, `consumption_unit`, `consumption_band`   |
| `app_download_click`  | Clic sui pulsanti dell'app                               | `placement`, `destination`                                              |
| `app_waitlist_signup` | Iscrizione alla lista d'attesa della beta riuscita       | `platform`                                                              |
| `share_calculation`   | Condivisione di un risultato                             | `method`, `fuel_type`, `station_name`                                   |

`city` è il comune del distributore (dato MIMIT), non la posizione
dell'utente. Il consumo è inviato solo come fascia. Non vengono mai inviati
coordinate, indirizzi, percorsi o email.
