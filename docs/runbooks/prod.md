# Ранбук — деплой и эксплуатация (prod, Docker)

Один домен = один сайт. Стёк: `postgres:16` + `admin` (Payload, :3001 внутри стека) + `web` (Nuxt SSR) + `Caddy` (TLS, :80/:443).

## Требования

- VPS (Ubuntu 22.04+): 4+ GB RAM, 2+ vCPU, ~20 GB disk
- Docker 24+ **с compose plugin** (`docker compose version`)
- Две DNS A-записи → IP сервера: `client.example.com` (сайт) и `admin.client.example.com` (админка)
- Порты 80/443 открытые (Let's Encrypt; для staging: `--staging`)
- (опционально) GNU Make. Без make — все команды приведены как raw `docker compose` ниже.

## 1. Развёртывание

```bash
git clone <repo> /srv/sirilcms && cd /srv/sirilcms
cp .env.example .env
```

Заполнить `.env` (production-блок + 3 ключа):

```bash
openssl rand -hex 16   # → в POSTGRES_PASSWORD и в POSTGRES_DB_URI
```

| Ключ | Значение |
|---|---|
| `SITE_DOMAIN` | `client.example.com` (guard compose: без него build не стартует) |
| `POSTGRES_PASSWORD` | сгенерированный пароль (обязателен, guard `:?set POSTGRES_PASSWORD`) |
| `POSTGRES_DB_URI` | `postgresql://payload:***@postgres:5432/payload` (нужен для `backup.sh`) |
| `PAYLOAD_SECRET` | **32+ символов**, свой (openssl rand -hex 24) |

`POSTGRES_USER`/`POSTGRES_DB` можно оставить `payload` (default в compose).

## 2. Подъём

```bash
make -C infra up
# без make (из корня repo):
docker compose -f infra/docker-compose.prod.yml --env-file .env up -d --build
```

Сборка 5–15 минут (pull base-образов + pnpm install в двух образах). Вывод: контейнеры `postgres / admin / web / caddy`, все `healthy`/`running`. Перед стартом admin отработает one-shot `migrate` (прикладывает миграции Payload и выходит 0) — это нормально.

| Сервис | Доступ | Роль |
|---|---|---|
| web | `https://client.example.com` (Caddy → web:3000) | SSR-сайт |
| admin | `https://admin.client.example.com` (Caddy → admin:3001) | Payload-админка |
| caddy | :80/:443 | reverse proxy + TLS; `admin.*` vhost тоже проксирует media `/media/*` |

> Admin в compose пробрасывает хост-порт `3001` (для локального демо/отладки). **На прод-сервере закройте 3001 в файрволе** — доступ только через `admin.*` домен (TLS + Caddy).

### 2.1 Первый админ (обязательно сделать сразу, до публикации сайта)

Создать через API **сразу после up** (миграции уже применены автоматически one-shot сервисом `migrate`, см. шаг 2):

```bash
curl -X POST https://admin.client.example.com/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Owner","email":"you@client.example.com","password":"<напр-32-сигла-или-сгенер-пароль>","role":"owner"}'
```

⚠️ **Обязательно передавать `"role":"owner"`.** По умолчанию роль `editor` (проверено trial-прогоном: первый пользователь без role получал editor и не мог управлять users/roles).
⚠️ Известный v1-дефект (T3-2): пока в БД нет ни одного user, любой анонимный вызов `POST /api/users` принимает любые поля — т.е. кто раньше догадается, тот и owner. Создать админа **до того, как сайт попадёт в интернет/поисковики**, и закрыть хост-порт 3001. Хеджирование (beforeValidate) — carry-over.

## 3. Проверка (smoke)

```bash
make -C infra ps
make -C infra logs            # логи всех сервисов (-f --tail=100)
make -C infra smoke           # wget из web: http://web:3000/api/health (200)
curl -s https://client.example.com/api/health          # 200
curl -s https://client.example.com/sitemap.xml | head    # absolute URLs
curl -sI https://client.example.com | head -3           # TLS: Let's Encrypt
```

TLS: Caddy автоматически выпустит Let's Encrypt (80/443 pубличные). Если DNS пока не прогнал — сертификат появится после; `make logs` покажет `caddy: ... Obtaining certificate`.

## 4. Эксплуатация

| Операция | Команда |
|---|---|
| Статус | `make -C infra ps` |
| Логи | `make -C infra logs <service>` (web/admin/caddy/postgres) |
| Рестарт сервиса | `docker compose -f infra/docker-compose.prod.yml --env-file .env restart web` |
| Обновление кода | `git pull && make -C infra up` (пересоберёт образы, поднимет) |
| Бэкап БД | `cd infra && POSTGRES_DB_URI="postgresql://payload:***@postgres:5432/payload" make backup` → `infra/backups/<date-time>.sql.gz` (авто-очистка >30 дн) |
| Восстановление | `gunzip < f.sql.gz \| docker compose -f infra/docker-compose.prod.yml --env-file .env exec -i postgres psql -U payload payload` |
| Новый сайт | `make -C infra new-site` (cp .env .env.<name>, свой project-name, свои домены) |

Ограничение: `backup.sh` и `new-site` используют **default** compose-проект `infra` без `--env-file`/`--project-name` — для сайтов из `make new-site` (`siril<name>`) бэкап запустить вручную с теми же флагами: `docker compose -f docker-compose.prod.yml --env-file ../.env --project-name siril<name> exec -T postgres pg_dump ...`. Запускать из каталога `infra` (путь `infra/backups`).

## 5. Типовые проблемы

| Симптом | Причина / решение |
|---|---|
| `POSTGRES_PASSWORD must be set` | `.env` — пустой/не задан `POSTGRES_PASSWORD`; путь `--env-file .env` = **root** (make из root, `make -C infra up` подставляет `--env-file ../.env`) |
| `SITE_DOMAIN is required` | нет `SITE_DOMAIN` в `.env` |
| `caddy` 502 | `web` не healthy → `make ps`, `make logs web`; проверить `PAYLOAD_URL=http://admin:3001` (compose задаёт сам) |
| Media (картинки) не грузятся | media URL = `https://admin.<domain>/api/media/file/…` (запечен в build `NUXT_PUBLIC_MEDIA_BASE`); DNS `admin.*` должен резолвиться; пересобрать web после изменения |
| 503 от Let's Encrypt | порты 80/443 не публичны или DNS A не указывает на сервер; staging: `docker compose run --rm caddy caddy cert-expiring ...` / домены временно в `tls internal` |
| Admin не стартует | `make logs admin` — типично `PAYLOAD_SECRET` < 32 символов |
| Изменения в контенте видны с задержкой | HTML-кэш web: TTL 5 мин (env `ROUTE_TTL` в web, сек). Нормально: публичация из админки шлёт purge (`POST web/api/purge`, Bearer `PURGE_TOKEN`) — страница обносится мгновенно. Если не обносится: заголовок `x-siril-cache: HIT` + проверьте `NUXT_URL=http://web:3000` в admin (иначе purge молча падает) |

## 6. Что **не** входит в v1 (carry-overs)

- Хеджирование first-user (T3-2) — сейчас: создать админа до публикации
- `admin:3001` host-порт — закрыть файрволом (см. §2)
- Автоматические бэкапы (cron) — `make backup` запускать вручную/через cron
- Multi-tenancy на одном домене — v1 модель: 1 домен = 1 сайт (через `new-site`)
