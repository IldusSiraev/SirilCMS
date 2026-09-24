# SirilCMS

Monorepo: `apps/admin` (Payload 3 + Next 16, :3001), `apps/web` (Nuxt, :3000), `packages/*`.

## Опс

- Конструктор форм (custom-страница админки): `/form-builder?form=<id>`
- `/design` — появится в T16
- Экспорт заявок формы в CSV (авторизованный, `Authorization: Bearer <token>`):
  `GET /api/submissions-csv?form=<id>` → `submissions-<id>.csv` (BOM + UTF-8, CRLF)
