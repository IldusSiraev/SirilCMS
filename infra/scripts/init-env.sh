#!/usr/bin/env bash
# Первая установка: генерирует .env из .env.example со случайными секретами.
# Использование: bash infra/scripts/init-env.sh <site-domain>
# Пример:        bash infra/scripts/init-env.sh client.example.com
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
ENV_FILE="$ROOT_DIR/.env"
EXAMPLE_FILE="$ROOT_DIR/.env.example"
SITE_DOMAIN="${1:-}"

if [[ -f "$ENV_FILE" ]]; then
  echo "$ENV_FILE уже существует — не перезаписываю. Удалите файл вручную, если хотите сгенерировать заново." >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl не найден — нужен для генерации секретов." >&2
  exit 1
fi

POSTGRES_PASSWORD="$(openssl rand -hex 16)"
PAYLOAD_SECRET="$(openssl rand -hex 24)"
PURGE_TOKEN="$(openssl rand -hex 24)"

cp "$EXAMPLE_FILE" "$ENV_FILE"

sed -i \
  -e "s|^PAYLOAD_SECRET=.*|PAYLOAD_SECRET=$PAYLOAD_SECRET|" \
  -e "s|^PURGE_TOKEN=.*|PURGE_TOKEN=$PURGE_TOKEN|" \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" \
  -e "s|^POSTGRES_DB_URI=.*|POSTGRES_DB_URI=postgresql://payload:$POSTGRES_PASSWORD@postgres:5432/payload|" \
  "$ENV_FILE"

if [[ -n "$SITE_DOMAIN" ]]; then
  sed -i -e "s|^SITE_DOMAIN=.*|SITE_DOMAIN=$SITE_DOMAIN|" "$ENV_FILE"
fi

echo "Готово: $ENV_FILE"
echo
echo "Сгенерированы: PAYLOAD_SECRET, PURGE_TOKEN, POSTGRES_PASSWORD (и POSTGRES_DB_URI с тем же паролем)."
if [[ -z "$SITE_DOMAIN" ]]; then
  echo "SITE_DOMAIN не задан аргументом — впишите домен клиента в $ENV_FILE вручную перед make -C infra up."
fi
echo
echo "Дальше: make -C infra up, затем сразу создать первого owner — см. docs/runbooks/prod.md §2.1."
