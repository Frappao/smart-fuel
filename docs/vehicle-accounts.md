# Account e auto salvate

Il sito usa Supabase Auth con codice email (registrazione automatica al primo
accesso). Il calcolo anonimo resta disponibile. L'app mobile condivide la scelta
L/100 km oppure km/L, ma non monta il provider degli account web.

## Attivazione

1. Applicare `supabase/migrations/202610210001_user_vehicles.sql` nel progetto
   Supabase corretto. `supabase/schema.sql` include la stessa tabella per nuove
   installazioni: non applicare entrambi sullo stesso database.
2. Configurare `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nel deployment web. Non usare la chiave
   segreta nel client.
3. Abilitare Email in Supabase Auth e consentire nuove registrazioni. Nel template
   Magic Link inserire il codice con `{{ .Token }}` (non soltanto il link).
   Configurare SMTP per l'invio agli utenti reali, scadenza OTP e limiti di invio.
4. Verificare in staging invio e verifica codice, ripristino sessione dopo reload,
   creazione/modifica/eliminazione di tre auto, cambio auto e logout.
5. Con due account distinti verificare che ciascuno veda solo le proprie auto e
   che richieste dirette di lettura, update o delete sugli ID dell'altro non
   restituiscano/modifichino righe. Verificare anche il diniego da anonimo.

La prima auto in ordine di creazione viene selezionata al nuovo accesso.
Nome/modello, carburante, consumo e unità sono salvati per ciascuna auto.
La conversione a L/100 km avviene al calcolo senza modificare il ranking.
La selezione di un'altra auto mantiene l'importo di rifornimento inserito.
Il riquadro La tua auto contiene solo nome, carburante, consumo e unità;
importo e modalità di servizio sono separati e non sono salvati nel profilo.
Il pulsante account è nella barra superiore della home. Gli utenti non connessi
vedono anche Registrati gratis nella home; entrambi aprono il pannello account.
La sessione Supabase è persistita nel localStorage; Esci usa lo scope locale.
Le risposte di caricamenti precedenti vengono ignorate al cambio account.

## Dati e manutenzione

Le policy RLS autorizzano solo `auth.uid() = user_id`, anche per l'aggiornamento
successivo del proprietario. La chiave pubblicabile non aggira le policy.
La cancellazione di un utente da Supabase Auth elimina le auto con ON DELETE
CASCADE. La UI permette la cancellazione delle auto; la richiesta di cancellazione
dell'account passa dal supporto. Privacy e cookie descrivono il comportamento
implementato; la revisione complessiva dell'informativa resta un passaggio di
rilascio, incluse conservazione e configurazione effettiva dei provider.

Riferimenti ufficiali:
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/database/postgres/row-level-security

Nessuna migrazione remota o email reale viene eseguita dai test unitari.

## Accesso Google sul sito

Il codice usa `signInWithOAuth` e il client Supabase standard gestisce il ritorno
OAuth nel browser. Non richiede un callback Next.js o nuove dipendenze.
Il redirect finale è la homepage dell'origine da cui parte l'accesso.

In Supabase Authentication > URL Configuration configurare Site URL
`https://rifornio.it` e consentire i redirect esatti `https://rifornio.it/` e,
per lo sviluppo locale, `http://localhost:3000/`. Aggiungere altri URL solo se
necessari per ambienti effettivamente usati.

### Google

- Usare un progetto Google Cloud, poi Google Auth Platform.
- Configurare Branding (Rifornio), Audience (External; aggiungere test users se
  in Testing) e Data Access con openid, userinfo.email e userinfo.profile.
- Creare un client OAuth Web application. Origine JavaScript: https://rifornio.it.
- Redirect URI: copiare il callback mostrato da Supabase nel provider Google,
  normalmente https://<project-ref>.supabase.co/auth/v1/callback.
- Inserire Client ID e Client Secret in Supabase > Google, poi abilitare e salvare.
- Per il rilascio pubblico verificare lo stato di pubblicazione su Google.

Verificare con Google: ritorno alla homepage autenticata, accesso alle
proprie auto, reload e logout; provare anche annullamento del consenso.
Il pulsante è implementato localmente, ma il servizio funziona solo dopo la
configurazione dei provider e dei redirect nelle dashboard.

- https://supabase.com/docs/guides/auth/social-login/auth-google
