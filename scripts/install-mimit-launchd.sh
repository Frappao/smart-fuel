#!/bin/zsh
# Installa (o rimuove con --uninstall) l'agente launchd che esegue ogni giorno
# l'import MIMIT dal Mac: il sito MIMIT non risponde ai datacenter cloud,
# quindi il cron Vercel non riesce a scaricare i CSV.
#
# Pianificazione: ogni 30 minuti e all'avvio/login. Ogni giro controlla la
# data dei CSV MIMIT e importa solo se sono più recenti dell'ultimo import
# riuscito, quindi l'import vero avviene una volta al giorno (dopo le ~8:45),
# appena il Mac è acceso e connesso. Se il Mac dorme, launchd esegue al
# risveglio. Il log viene ruotato oltre 1 MB.
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
    <string>if [ -f "$LOG" ] &amp;&amp; [ \$(stat -f%z "$LOG") -gt 1000000 ]; then mv -f "$LOG" "$LOG.1"; fi; echo "=== \$(date '+%Y-%m-%d %H:%M:%S') ==="; cd "$REPO" &amp;&amp; "$NPM" run --silent import:mimit:local</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>$NODE_DIR:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>StartInterval</key>
  <integer>1800</integer>
  <key>RunAtLoad</key>
  <true/>
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

echo "Agente $LABEL installato: controllo ogni 30 minuti e all'avvio (import solo se MIMIT ha file nuovi)."
echo "Prova subito:   launchctl kickstart $DOMAIN/$LABEL"
echo "Log:            $LOG"
