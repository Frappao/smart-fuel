#!/bin/zsh
# Installa (o rimuove con --uninstall) l'agente launchd che esegue ogni giorno
# l'import MIMIT dal Mac: il sito MIMIT non risponde ai datacenter cloud,
# quindi il cron Vercel non riesce a scaricare i CSV.
#
# Orari: 9:30 (il file MIMIT "prezzo_alle_8" esce verso le 8:45) e 14:00
# come recupero. Se il Mac dorme a quell'ora, launchd esegue al risveglio;
# se è spento, il run viene saltato. L'import è idempotente.
#
# Log: ~/Library/Logs/rifornio-import-mimit.log
# Storico: tabella public.import_runs (source = 'mimit-mac')

set -euo pipefail

LABEL="it.rifornio.import-mimit"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/rifornio-import-mimit.log"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
NPM="$(command -v npm)"
NODE_DIR="$(dirname "$(command -v node)")"
DOMAIN="gui/$(id -u)"

if [[ "${1:-}" == "--uninstall" ]]; then
  launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Agente $LABEL rimosso."
  exit 0
fi

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-c</string>
    <string>echo "=== \$(date '+%Y-%m-%d %H:%M:%S') ==="; cd "$REPO" &amp;&amp; "$NPM" run import:mimit:local</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>$NODE_DIR:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>StartCalendarInterval</key>
  <array>
    <dict>
      <key>Hour</key>
      <integer>9</integer>
      <key>Minute</key>
      <integer>30</integer>
    </dict>
    <dict>
      <key>Hour</key>
      <integer>14</integer>
      <key>Minute</key>
      <integer>0</integer>
    </dict>
  </array>
  <key>StandardOutPath</key>
  <string>$LOG</string>
  <key>StandardErrorPath</key>
  <string>$LOG</string>
</dict>
</plist>
PLIST

plutil -lint "$PLIST" >/dev/null
launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
launchctl bootstrap "$DOMAIN" "$PLIST"

echo "Agente $LABEL installato: ogni giorno alle 9:30 e alle 14:00."
echo "Prova subito:   launchctl kickstart $DOMAIN/$LABEL"
echo "Log:            $LOG"
