#!/usr/bin/env bash
# Restore-drill: проверяет, что дамп из backup.sh реально восстанавливается.
# Поднимает одноразовый postgres, заливает дамп, сверяет ключевые таблицы, удаляет контейнер.
# Использование: bash infra/scripts/restore-check.sh [infra/backups/<file>.sql.gz]   (по умолчанию — самый свежий)
# Выход 0 — дамп восстановился и содержит данные; != 0 — проблема (+ Telegram-алерт, если настроен, как в backup.sh).
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
DUMP="${1:-$(ls -1t "$DIR"/backups/*.sql.gz 2>/dev/null | head -1)}"
PG_IMAGE="${PG_IMAGE:-postgres:16}"
NAME="siril-restore-check-$$"

if [ -z "$DUMP" ] || [ ! -f "$DUMP" ]; then echo "restore-check: дамп не найден (${DUMP:-<none>})" >&2; exit 2; fi

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] && [ -f "$DIR/../.env" ]; then set -a; source "$DIR/../.env"; set +a; fi
alert() {
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${ALERT_TELEGRAM_CHAT_ID:-}" ]; then
    curl -sf -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${ALERT_TELEGRAM_CHAT_ID}" --data-urlencode "text=$1" >/dev/null || true
  fi
}
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT
fail() { echo "restore-check: FAILED — $1" >&2; alert "SirilCMS restore-check FAILED on $(hostname): $1 ($DUMP)"; exit 1; }

docker run -d --name "$NAME" -e POSTGRES_PASSWORD=drill -e POSTGRES_USER=payload -e POSTGRES_DB=payload "$PG_IMAGE" >/dev/null \
  || fail "не удалось поднять $PG_IMAGE"
for _ in $(seq 1 30); do
  docker exec "$NAME" pg_isready -h 127.0.0.1 -U payload -d payload >/dev/null 2>&1 && break
  sleep 1
done
# Entrypoint сначала поднимает временный сервер (только unix-сокет), потом рестартует его — pg_isready по TCP ждёт финальный.

# ON_ERROR_STOP: любая ошибка восстановления — провал, а не "почти получилось".
gunzip -c "$DUMP" | docker exec -i "$NAME" psql -U payload -d payload -v ON_ERROR_STOP=1 -q >/dev/null 2>"$DIR/.restore-check.err" \
  || fail "psql: $(tail -c 300 "$DIR/.restore-check.err")"
rm -f "$DIR/.restore-check.err"

q() { docker exec "$NAME" psql -U payload -d payload -Atc "$1"; }
tables="$(q "select count(*) from information_schema.tables where table_schema='public'")"
users="$(q "select count(*) from users" 2>/dev/null || echo ERR)"
sites="$(q "select count(*) from sites" 2>/dev/null || echo ERR)"
migs="$(q "select count(*) from payload_migrations" 2>/dev/null || echo ERR)"

[ "$tables" -gt 0 ] 2>/dev/null || fail "в восстановленной БД нет таблиц"
[ "$users" != ERR ] && [ "$sites" != ERR ] && [ "$migs" != ERR ] || fail "нет таблиц users/sites/payload_migrations"
[ "$users" -ge 1 ] || fail "таблица users пуста — дамп без данных?"

echo "restore-check: OK — $DUMP: tables=$tables users=$users sites=$sites migrations=$migs"
