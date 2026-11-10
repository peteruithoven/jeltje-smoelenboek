#!/usr/bin/env sh
# Bouwt de app lokaal en zet alleen het resultaat op de server (geen install/build op de server).
#
#   vp run deploy
#
# DEPLOY_HOST: ssh-host (standaard "smoelenboek", zie ~/.ssh/config)
# DEPLOY_DIR:  map op de server, relatief aan de home-map (standaard "smoelenboek")
set -eu

HOST="${DEPLOY_HOST:-smoelenboek}"
DIR="${DEPLOY_DIR:-smoelenboek}"

cd "$(dirname "$0")/.."

vp run build

# -R behoudt de paden; --delete ruimt oude build-bestanden op binnen de meegestuurde mappen.
# De database staat buiten deze map (NUXT_DATA_DIR) en wordt dus nooit aangeraakt.
rsync -azR --delete \
  .output \
  server.mjs \
  package.json \
  scripts/admin.ts \
  server/lib \
  "$HOST:$DIR/"

echo
echo "Geüpload naar $HOST:$DIR. Herstart de site in het Alwaysdata-panel (Web → Sites)."
