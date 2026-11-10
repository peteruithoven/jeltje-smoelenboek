#!/usr/bin/env sh
# Bouwt de app en zet alleen het resultaat op de server (geen install/build op de server).
# Wordt ook gebruikt door GitHub Actions (.github/workflows/deploy.yml).
#
#   vp run deploy
#
# DEPLOY_HOST:           ssh-host (standaard "smoelenboek", zie ~/.ssh/config)
# DEPLOY_DIR:            map op de server, relatief aan de home-map (standaard "smoelenboek")
# SKIP_BUILD=1:          niet bouwen, de bestaande .output gebruiken
# ALWAYSDATA_API_TOKEN:  als gezet, wordt de site na het uploaden via de API herstart
# ALWAYSDATA_ACCOUNT:    accountnaam (standaard "jeltje-smoelenboek")
# ALWAYSDATA_SITE_ID:    site-ID (standaard 1102900)
set -eu

HOST="${DEPLOY_HOST:-smoelenboek}"
DIR="${DEPLOY_DIR:-smoelenboek}"
ACCOUNT="${ALWAYSDATA_ACCOUNT:-jeltje-smoelenboek}"
SITE_ID="${ALWAYSDATA_SITE_ID:-1102900}"

cd "$(dirname "$0")/.."

if [ "${SKIP_BUILD:-}" != 1 ]; then
  vp run build
fi

# -R behoudt de paden; --delete ruimt oude build-bestanden op binnen de meegestuurde mappen.
# De database staat buiten deze map (NUXT_DATA_DIR) en wordt dus nooit aangeraakt.
rsync -azR --delete \
  .output \
  server.mjs \
  package.json \
  scripts/admin.ts \
  server/lib \
  "$HOST:$DIR/"

echo "Geüpload naar $HOST:$DIR."

if [ -n "${ALWAYSDATA_API_TOKEN:-}" ]; then
  curl --fail-with-body --silent --show-error -X POST \
    --user "$ALWAYSDATA_API_TOKEN account=$ACCOUNT:" \
    "https://api.alwaysdata.com/v1/site/$SITE_ID/restart/"
  echo "Site $SITE_ID herstart."
else
  echo "Herstart de site in het Alwaysdata-panel (Web → Sites), of zet ALWAYSDATA_API_TOKEN."
fi
