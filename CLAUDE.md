@AGENTS.md

# Note specifiche per Claude

Le istruzioni in AGENTS.md valgono integralmente anche per Claude, in
particolare "Working rules for agents" (niente commit/push senza richiesta
esplicita: un push su `main` va in produzione su rifornio.it).

Se noti che AGENTS.md non corrisponde più al codice o al database (rotte,
migrazioni, flussi), aggiornalo nella stessa modifica.

## Lingua

- Rispondi a Francesco in italiano.
- Testi dell'interfaccia in italiano; codice, nomi di variabili e messaggi di
  commit seguono lo stile esistente (commit tipo `feat(ui): ...` in italiano).

## Ambiente

- Il progetto vive sul Mac di Francesco (`~/Documents/smart-fuel`). I
  `node_modules` sono installati per macOS arm64.
- Dev server: usa il preview `web` di `.claude/launch.json` (porta 3000),
  non avviarlo da Bash.
- I worktree di Claude stanno in `.claude/worktrees/` (esclusi da Vitest).
- Connettori Supabase e Vercel: usali liberamente in sola lettura (tabelle,
  log, deploy) per verificare lo stato reale. Migrazioni, scritture sul
  database, variabili d'ambiente e deploy solo su richiesta esplicita.
- Se lavori da una sessione cloud/VM Linux collegata alla cartella:
  - NON eseguire `npm install`/`npm ci` né cancellare `node_modules`:
    sostituiresti i binari macOS e romperesti l'ambiente sul Mac.
  - Funzionano: `npx tsc --noEmit`, `npx eslint <file>`, `git diff --check`,
    `git status/diff/log`.
  - Non funzionano (binari nativi solo darwin: rolldown, swc, lightningcss):
    `npm test`/`vitest`, `npm run build`, `npm run dev`. In quel caso
    dichiaralo e chiedi a Francesco di lanciarli sul Mac.
  - Le cancellazioni nella cartella vanno abilitate una volta per sessione
    (permesso di cancellazione): senza, `git commit`, `checkout`, `stash`
    lasciano file `.lock` in `.git`. Chiedilo subito se serve.
  - La rete in questa VM può essere chiusa (GitHub e npm rispondono 403):
    in quel caso `git push`/`fetch` e le installazioni non sono possibili,
    li fa Francesco dal Mac.

## Autonomia

- Francesco vuole lavorare come con Codex: scrive la richiesta e tu esegui
  fino in fondo senza chiedere conferme intermedie (leggi, modifica, verifica,
  riassumi). Chiedi solo per scelte di prodotto ambigue o irreversibili.
- Commit: solo quando Francesco lo chiede (anche "committa" basta).
- Push: solo su richiesta esplicita, perché un push su `main` va in
  produzione.
- Non leggere né stampare `.env.local`, `.vercel/` o keystore Android.
  Per sapere quali variabili esistono usa `.env.example`.

## Skill del progetto

In `.claude/skills/` (collegamenti ai file originali, non duplicarli):

- `apple-design` → `.agents/skills/apple-design/` (UI fluida, animazioni,
  gesture, tipografia).
- `3d-web-experience` → `SKILL_3D Web Experience.md` (Three.js, scene 3D come
  il simulatore in homepage).
