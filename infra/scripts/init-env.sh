#!/usr/bin/env bash
# Первая установка: генерирует .env из .env.example со случайными секретами.
# Использование: bash infra/scripts/init-env.sh <site-domain> <owner-email>
# Пример:        bash infra/scripts/init-env.sh client.example.com owner@client.example.com
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
ENV_FILE="$ROOT_DIR/.env"
EXAMPLE_FILE="$ROOT_DIR/.env.example"
SITE_DOMAIN="${1:-}"
OWNER_EMAIL="${2:-}"

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
OWNER_PASSWORD="$(openssl rand -hex 12)"

cp "$EXAMPLE_FILE" "$ENV_FILE"

sed -i \
  -e "s|^PAYLOAD_SECRET=.*|PAYLOAD_SECRET=$PAYLOAD_SECRET|" \
  -e "s|^PURGE_TOKEN=.*|PURGE_TOKEN=$PURGE_TOKEN|" \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" \
  -e "s|^POSTGRES_DB_URI=.*|POSTGRES_DB_URI=postgresql://payload:$POSTGRES_PASSWORD@postgres:5432/payload|" \
  "$ENV_FILE"

if [[ -n "$OWNER_EMAIL" ]]; then
  sed -i \
    -e "s|^INITIAL_OWNER_EMAIL=.*|INITIAL_OWNER_EMAIL=$OWNER_EMAIL|" \
    -e "s|^INITIAL_OWNER_PASSWORD=.*|INITIAL_OWNER_PASSWORD=$OWNER_PASSWORD|" \
    "$ENV_FILE"
fi

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
if [[ -n "$OWNER_EMAIL" ]]; then
  echo "Первый owner создастся при первом старте admin: $OWNER_EMAIL, пароль — INITIAL_OWNER_PASSWORD в $ENV_FILE (смените после входа)."
else
  echo "Email owner не задан вторым аргументом — впишите INITIAL_OWNER_EMAIL/INITIAL_OWNER_PASSWORD в $ENV_FILE вручную: анонимная регистрация в проде отключена, без них войти в админку нельзя."
fi
echo
echo "Дальше: make -C infra up — см. docs/runbooks/prod.md §2.1."
