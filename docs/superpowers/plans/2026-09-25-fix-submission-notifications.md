# Fix Submission Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the roadmap phase-1 bug where form-submission email notifications never fire, by moving notification logic from `apps/web` (which cannot read owner-only SMTP settings) into an `apps/admin` afterChange hook on `form-submissions` (which has internal DB access).

**Architecture:** `apps/web`'s public submit endpoint already POSTs the submission to admin's public `/api/form-submissions` create endpoint — it does not need to know about SMTP/Telegram at all. Add a `hooks.afterChange` on the `FormSubmissions` collection (mirrors the existing `publishHook` pattern in `pages.ts`) that runs only on `operation === 'create'`, loads the related `site` and `form` docs with `overrideAccess: true` (bypassing the owner-only field access that currently makes `settings.smtpHost` always `undefined` for public reads), and sends the notification. Delete the now-dead `apps/web/server/utils/notify.ts` and its call site.

**Tech Stack:** Payload 3 (Local API, `CollectionConfig.hooks.afterChange`), nodemailer, vitest.

**Spec:** [docs/roadmap.md](../../roadmap.md) — Фаза 1 → Баги → "Email-уведомления о заявках никогда не отправляются."

## Global Constraints

- Do not add new abstractions beyond what this fix needs (no notification queue, no retry system — the existing pattern is fire-and-forget with a caught/logged error, same as `publishHook`).
- Keep the pure "build message text" logic separate from I/O so it stays unit-testable without a DB or network, matching this repo's existing test style (`apps/admin/src/access.test.ts` tests pure `canScope`/`isOwner`, not hooks).
- `pnpm test` (all workspaces) and `pnpm -r build` must stay green.

---

## File Structure

- **Create** `apps/admin/src/utils/notify.ts` — pure `buildNotificationText()` + `notifySubmission()` (the actual hook body: fetch site+form, send email/Telegram).
- **Create** `apps/admin/src/utils/notify.test.ts` — unit test for `buildNotificationText()`.
- **Modify** `apps/admin/src/collections/form-submissions.ts` — wire `notifySubmission` into `hooks.afterChange`.
- **Modify** `apps/admin/package.json` — add `nodemailer` dependency (admin now owns email sending).
- **Modify** `apps/web/server/api/forms/[slug]/submit.post.ts` — remove the `notifyNewSubmission` import and call.
- **Delete** `apps/web/server/utils/notify.ts` — dead after the call site is removed.
- **Modify** `apps/web/package.json` — remove `nodemailer` dependency (no longer used by web).
- **Modify** `docs/roadmap.md` — check off the fixed bug.

---

## Task 1: Move notification logic into the admin hook

**Files:**
- Create: `apps/admin/src/utils/notify.ts`
- Create: `apps/admin/src/utils/notify.test.ts`
- Modify: `apps/admin/src/collections/form-submissions.ts`
- Modify: `apps/admin/package.json`

**Interfaces:**
- Produces: `buildNotificationText(formName: string, values: { name?: string | null; value?: string | null }[]): string`
- Produces: `notifySubmission(payload: import('payload').BasePayload, doc: import('../../payload-types').FormSubmission): Promise<void>`
- Consumes (existing, unchanged): `Site`, `Form`, `FormSubmission` types from `apps/admin/payload-types.ts`; `process.env.TELEGRAM_BOT_TOKEN`.

- [ ] **Step 1: Write the failing test for the pure text builder**

Create `apps/admin/src/utils/notify.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildNotificationText } from './notify'

describe('buildNotificationText', () => {
  it('joins form name and values into one line', () => {
    const text = buildNotificationText('Обратная связь', [
      { name: 'name', value: 'Иван' },
      { name: 'email', value: 'ivan@example.com' },
    ])
    expect(text).toBe('Заявка (Обратная связь): name: Иван | email: ivan@example.com')
  })

  it('handles no values', () => {
    expect(buildNotificationText('Форма', [])).toBe('Заявка (Форма): ')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @siril/admin test`
Expected: FAIL — `Failed to resolve import "./notify"` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `apps/admin/src/utils/notify.ts`:

```ts
import type { BasePayload } from 'payload'
import type { Form, FormSubmission, Site } from '../../payload-types'

export function buildNotificationText(formName: string, values: { name?: string | null; value?: string | null }[]): string {
  return `Заявка (${formName}): ${values.map((v) => `${v.name}: ${v.value}`).join(' | ')}`
}

export async function notifySubmission(payload: BasePayload, doc: FormSubmission): Promise<void> {
  const siteId = typeof doc.site === 'object' ? doc.site.id : doc.site
  const formId = typeof doc.form === 'object' ? doc.form.id : doc.form
  const [site, form] = await Promise.all([
    payload.findByID<'sites', Site>({ collection: 'sites', id: siteId, overrideAccess: true }),
    payload.findByID<'forms', Form>({ collection: 'forms', id: formId, overrideAccess: true }),
  ])
  const text = buildNotificationText(form.name, doc.values ?? [])

  if (site.settings?.smtpHost) {
    const { default: nodemailer } = await import('nodemailer')
    const smtp = nodemailer.createTransport({
      host: site.settings.smtpHost,
      port: Number(site.settings.smtpPort) || 587,
      auth: site.settings.smtpUser ? { user: site.settings.smtpUser, pass: site.settings.smtpPass ?? undefined } : undefined,
    })
    if (site.contacts?.email) {
      await smtp.sendMail({ from: site.settings.smtpUser ?? undefined, to: site.contacts.email, subject: `Заявка: ${form.name}`, text })
    }
  }

  const tgToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = site.contacts?.telegram
  if (tgToken && chatId) {
    await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }).catch(() => {})
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @siril/admin test`
Expected: PASS (all admin tests, including the 2 new ones).

- [ ] **Step 5: Wire the hook into the collection**

Modify `apps/admin/src/collections/form-submissions.ts` — add the import and `hooks` block (insert after the `access` block, before `fields`, matching the `pages.ts` `hooks.afterChange` placement):

```ts
import type { CollectionConfig } from 'payload'
import { canScope } from '../access/site-scope'
import { notifySubmission } from '../utils/notify'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    defaultColumns: ['form', 'ip', 'createdAt'],
    description: 'Заявки: read-only (создаёт web)',
  },
  access: {
    read: ({ req: { user }, data }) => canScope(user, data?.site ?? 1) || !!user,
    create: () => true,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    afterChange: [
      ({ doc, req, operation }) => {
        if (operation !== 'create') return
        notifySubmission(req.payload, doc).catch((err) => console.error('[notify] failed', err))
      },
    ],
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'form', type: 'relationship', relationTo: 'forms', required: true },
    { name: 'values', type: 'array', fields: [
      { name: 'name', type: 'text' },
      { name: 'value', type: 'text' },
    ] },
    { name: 'ip', type: 'text' },
  ],
}
```

- [ ] **Step 6: Add `nodemailer` to admin's dependencies**

Modify `apps/admin/package.json` — add to `"dependencies"` (alphabetical, matches existing style):

```json
    "nodemailer": "^10.0.10",
```

Then run:

```bash
pnpm install
```

Expected: lockfile updates, `nodemailer` now resolves inside `apps/admin`.

- [ ] **Step 7: Run full admin test suite to verify nothing broke**

Run: `pnpm --filter @siril/admin test`
Expected: PASS — all admin tests including `access.test.ts`, `test/smoke.test.ts`, and the 2 new `notify.test.ts` cases.

- [ ] **Step 8: Commit**

```bash
git add apps/admin/src/utils/notify.ts apps/admin/src/utils/notify.test.ts apps/admin/src/collections/form-submissions.ts apps/admin/package.json pnpm-lock.yaml
git commit -m "fix(admin): send submission notifications from an afterChange hook

Public web reads could never see owner-only settings.smtpHost, so SMTP
notifications were silently dead code. Move the notification logic into
an admin-side hook with overrideAccess, which can read the full site doc."
```

---

## Task 2: Remove the dead notification code from web

**Files:**
- Modify: `apps/web/server/api/forms/[slug]/submit.post.ts`
- Delete: `apps/web/server/utils/notify.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- Consumes: nothing new — this task only removes now-unused code. `POST {PAYLOAD_URL}/api/form-submissions` (already called at `submit.post.ts:28`) is what triggers Task 1's hook.

- [ ] **Step 1: Remove the notify import and call from the submit endpoint**

Modify `apps/web/server/api/forms/[slug]/submit.post.ts` — remove line 5 (`import { notifyNewSubmission } from '../../../utils/notify'`) and remove line 35 (the `notifyNewSubmission(...).catch(...)` call). The file should end with:

```ts
import { readBody } from 'h3'
import { validateSubmission } from '@siril/blocks-definitions'
import { payloadGet } from '../../../utils/payload'
import { rateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const slug = String(event.context.params?.slug ?? '')
  const forwarded = event.headers.get('x-forwarded-for')
  const ip = (forwarded ? forwarded.split(',')[0].trim() : '') || (event.node.req.socket.remoteAddress ?? 'unknown')
  if (!rateLimit(`form:${slug}:${ip}`)) throw createError({ statusCode: 429, message: 'Too many requests' })
  const body: Record<string, unknown> = await readBody(event)
  const { docs } = await payloadGet<{ docs: any[] }>(`forms?where[slug][equals]=${encodeURIComponent(slug!)}&depth=2`)
  const form = docs[0]
  if (!form) throw createError({ statusCode: 404, message: 'Form not found' })
  const honeypot = form.fields.find((f: any) => f.type === 'honeypot')
  if (honeypot && body[honeypot.name]) return { ok: true }
  const values = form.fields
    .filter((f: any) => ['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'checkbox-group', 'date', 'consent'].includes(f.type))
    .map((f: any) => ({ name: f.name, value: body[f.name] }))
  const fields = form.fields
    .filter((f: any) => f.type !== 'file')
    .map((f: any) => ({ id: f.id ?? f.name, name: f.name, label: f.label, required: !!f.required, options: f.options ? String(f.options).split('\n') : undefined }))
  const v = validateSubmission(fields, Object.fromEntries(values.map((p: any) => [p.name, p.value])), {})
  if (!v.ok) return { ok: false, errors: v.errors }
  const siteId = typeof form.site === 'object' ? form.site.id : form.site
  try {
    await $fetch(`${useRuntimeConfig().PAYLOAD_URL}/api/form-submissions`, {
      method: 'POST',
      body: { site: siteId, form: form.id, values, ip },
    })
  } catch {
    throw createError({ statusCode: 422, message: 'Не удалось сохранить заявку' })
  }
  return { ok: true }
})
```

- [ ] **Step 2: Delete the dead file**

```bash
rm apps/web/server/utils/notify.ts
```

- [ ] **Step 3: Remove the now-unused `nodemailer` dependency**

Modify `apps/web/package.json` — remove the `"nodemailer": "^10.0.10",` line from `"dependencies"`.

Then run:

```bash
pnpm install
```

Expected: lockfile updates, `nodemailer` no longer listed under `apps/web`.

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test`
Expected: PASS — 38 tests total (16 blocks / 4 admin → now 6 admin / 18 web), no references to the deleted file.

- [ ] **Step 5: Run a full workspace build to catch stale imports**

Run: `pnpm -r build`
Expected: PASS (needs `PAYLOAD_SECRET`, `PAYLOAD_DB_URI`, `PAYLOAD_URL` env vars set, or a reachable Postgres — same as the CI `build` job in `.github/workflows/ci.yml`).

- [ ] **Step 6: Commit**

```bash
git add apps/web/server/api/forms/[slug]/submit.post.ts apps/web/package.json pnpm-lock.yaml
git commit -m "fix(web): drop dead notification code, now handled by admin hook"
git rm apps/web/server/utils/notify.ts
git commit -m "fix(web): remove unused notify.ts (moved to apps/admin)"
```

(Two commits shown for clarity — combine into one if preferred, since both are part of the same cleanup.)

---

## Task 3: Update the roadmap

**Files:**
- Modify: `docs/roadmap.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Check off the fixed bug**

In `docs/roadmap.md`, under "Фаза 1 → Баги", change:

```
- [ ] **Email-уведомления о заявках никогда не отправляются.**
```

to:

```
- [x] **Email-уведомления о заявках никогда не отправляются.**
```

Leave the explanatory text below it as historical context (or trim to a one-line note — either is fine).

- [ ] **Step 2: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs(roadmap): mark submission-notification bug as fixed"
```
