#!/usr/bin/env bash
set -uo pipefail
DB_URI="${POSTGRES_DB_URI:?set POSTGRES_DB_URI}"
ORIG_DIR="$(pwd)"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$DIR"

# Алерт-переменные (TELEGRAM_BOT_TOKEN, ALERT_TELEGRAM_CHAT_ID) обычно не экспортируются вручную
# при вызове из cron — подхватываем их из корневого .env, если он есть и они ещё не заданы.
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] && [ -f "$DIR/../.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$DIR/../.env"
  set +a
fi

alert() {
  local msg="$1"
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${ALERT_TELEGRAM_CHAT_ID:-}" ]; then
    curl -sf -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${ALERT_TELEGRAM_CHAT_ID}" --data-urlencode "text=$msg" >/dev/null || true
  fi
}

mkdir -p backups
f="backups/$(date +%F-%H%M).sql.gz"
err="$(mktemp)"

docker compose -f docker-compose.prod.yml exec -T postgres pg_dump "$DB_URI" 2>"$err" | gzip > "$f"
status=${PIPESTATUS[0]}
if [ "$status" -ne 0 ]; then
  docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "${POSTGRES_USER:-payload}" "${POSTGRES_DB:-payload}" 2>"$err" | gzip > "$f"
  status=${PIPESTATUS[0]}
fi

if [ "$status" -ne 0 ]; then
  rm -f "$f"
  msg="SirilCMS backup FAILED on $(hostname) at $(date -Is): $(tail -c 500 "$err")"
  echo "backup: FAILED — $msg" >&2
  alert "$msg"
  rm -f "$err"
  cd "$ORIG_DIR"
  exit 1
fi

rm -f "$err"
find backups -name '*.sql.gz' -mtime +30 -delete
cd "$ORIG_DIR"
echo "backup: $f"
