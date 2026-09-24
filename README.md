# SirilCMS

Monorepo: `apps/admin` (Payload 3 + Next 16, :3001), `apps/web` (Nuxt, :3000), `packages/*`.

## Опс

- Конструктор форм (custom-страница админки): `/form-builder?form=<id>`
- Предпросмотр дизайна тем: `/design` (свотчи, радиокнопки, Save → PATCH site)
- Экспорт заявок формы в CSV (авторизованный, `Authorization: Bearer <token>`):
  `GET /api/submissions-csv?form=<id>` → `submissions-<id>.csv` (BOM + UTF-8, CRLF)

## Деплой (Docker)

Prereq: `docker` с compose, в корне `.env` заполнены `POSTGRES_PASSWORD`, `PAYLOAD_SECRET` (32+ символов), `SITE_DOMAIN`.

```sh
make -C infra up       # сборка + поднимает postgres, admin, web, caddy
make -C infra ps       # статус
make -C infra logs     # логи
make -C infra new-site # инструкция на второй сайт (свой .env.<name> + project-name)
```

Бэкап БД: `cd infra && POSTGRES_DB_URI=postgresql://... make backup` → `infra/backups/*.sql.gz` (авто-очистка > 30 дней).

Локальный демо без домена: в `.env` — `SITE_DOMAIN=localhost`; админка доступна на `http://localhost:3001` (порт пробрасывает `3001:3001` в compose). Для демо `web` пересобрать с локальным media: `docker compose -f infra/docker-compose.prod.yml --env-file infra/.env build --build-arg NUXT_PUBLIC_MEDIA_BASE=http://localhost:3001`. С реальным доменом Caddy сам выпустит Let's Encrypt (80/443).
