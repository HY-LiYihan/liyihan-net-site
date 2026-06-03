#!/bin/sh
set -eu

: "${LIYIHAN_WEB_ROOT:=/usr/share/nginx/html}"
export LIYIHAN_WEB_ROOT

node scripts/publish-site.mjs
node scripts/refresh-server.mjs &

exec "$@"
