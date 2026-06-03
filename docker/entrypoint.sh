#!/bin/sh
set -eu

: "${LIYIHAN_WEB_ROOT:=/usr/share/nginx/html}"
: "${SITE_DOMAIN:=_}"
export LIYIHAN_WEB_ROOT

sed "s|__SITE_DOMAIN__|$SITE_DOMAIN|g" /app/nginx/default.conf > /etc/nginx/http.d/default.conf

node scripts/publish-site.mjs
node scripts/refresh-server.mjs &

exec "$@"
