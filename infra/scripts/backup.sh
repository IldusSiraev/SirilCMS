#!/usr/bin/env bash
set -euo pipefail
DB_URI="${POSTGRES_DB_URI:?set POSTGRES_DB_URI}"
ORIG_DIR="$(pwd)"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$DIR"
mkdir -p backups
f="backups/$(date +%F-%H%M).sql.gz"
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump "$DB_URI" | gzip > "$f" || docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "${POSTGRES_USER:-payload}" "${POSTGRES_DB:-payload}" | gzip > "$f"
find backups -name '*.sql.gz' -mtime +30 -delete
cd "$ORIG_DIR"
echo "backup: $f"
