'use client'

import { useCallback, useEffect, useState } from 'react'
import { THEMES } from '@siril/blocks-definitions'
import type { ThemeDef } from '@siril/blocks-definitions'

type Site = { id: number; theme: string }

// Начальное состояние — из server- части (SSR: радиокнопки + свотчи видны без JS);
// дальше страница сама синхронизируется same-origin fetch (ruling 4).
export type DesignInitial =
  | { kind: 'site'; id: number; theme: string }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }

const styles = {
  wrap: { padding: '1.5rem 2rem', maxWidth: '720px' } as const,
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 0',
    borderBottom: '1px solid #e5e7eb',
  } as const,
  swatch: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    borderRadius: '2px',
    flexShrink: 0,
  } as const,
  name: { marginLeft: '0.25rem' } as const,
  btn: { cursor: 'pointer', padding: '0.4rem 0.9rem' } as const,
}

// Свотчи темы: primary / bg (с рамкой — фон может быть белым) / text, по tokens темы.
const swatches = (t: ThemeDef) => {
  const primary = t.tokens['--c-primary']
  const bg = t.tokens['--c-bg']
  const text = t.tokens['--c-text']
  return (
    <>
      <span style={{ ...styles.swatch, background: primary }} title={`primary: ${primary}`} />
      <span
        style={{ ...styles.swatch, background: bg, border: '1px solid #d1d5db' }}
        title={`bg: ${bg}`}
      />
      <span style={{ ...styles.swatch, background: text }} title={`text: ${text}`} />
    </>
  )
}

// Страница-свитчер тем: список THEMES c превью-свотчами, radio выбранной,
// Save → PATCH /api/sites/<id> { theme } (house law: update = только PATCH).
export default function DesignClient({ initial }: { initial: DesignInitial }) {
  const [site, setSite] = useState<Site | null | undefined>(
    initial.kind === 'site' ? { id: initial.id, theme: initial.theme } : initial.kind === 'empty' ? null : undefined,
  )
  const [pending, setPending] = useState(initial.kind === 'site' ? initial.theme : '')
  const [status, setStatus] = useState('')
  const [loadError, setLoadError] = useState(initial.kind === 'error' ? `Ошибка загрузки: ${initial.message}` : '')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/sites?limit=1')
      const json = (await res.json()) as {
        docs?: Array<{ id: number; theme: string }>
        errors?: Array<{ message?: string }>
        message?: string
      }
      if (!res.ok) {
        throw new Error(json?.errors?.[0]?.message ?? json?.message ?? `HTTP ${res.status}`)
      }
      const first = json?.docs?.[0]
      if (!first) {
        setSite(null)
        setLoadError('')
        return
      }
      setSite({ id: first.id, theme: first.theme })
      setPending(first.theme)
      setLoadError('')
      setStatus('')
    } catch (e) {
      setLoadError(`Ошибка загрузки: ${(e as Error).message}`)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    if (!site || !pending || saving) return
    setSaving(true)
    setStatus('')
    try {
      const res = await fetch(`/api/sites/${site.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: pending }),
      })
      const json = (await res.json()) as {
        errors?: Array<{ message?: string }>
        message?: string
      }
      if (!res.ok) {
        throw new Error(json?.errors?.[0]?.message ?? json?.message ?? `HTTP ${res.status}`)
      }
      setStatus('Сохранено — тема применится на следующем purge (хук T8).')
      await load()
    } catch (e) {
      setStatus(`Ошибка сохранения: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  if (site === undefined) {
    return (
      <div style={styles.wrap}>
        <h1 style={{ marginTop: 0 }}>Дизайн</h1>
        {loadError ? <div>{loadError}</div> : <div>Загрузка…</div>}
      </div>
    )
  }

  if (site === null) {
    return (
      <div style={styles.wrap}>
        <h1 style={{ marginTop: 0 }}>Дизайн</h1>
        <div>Нет сайта — создайте в Collection (admin → sites).</div>
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      <h1 style={{ marginTop: 0 }}>Дизайн — темы сайта</h1>
      <p style={{ marginTop: 0 }}>
        Текущая тема: <strong>{site.theme}</strong>
      </p>

      {THEMES.map((t) => (
        <label key={t.id} style={{ ...styles.row, flexDirection: 'column', alignItems: 'stretch' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name="site-theme"
              value={t.id}
              checked={pending === t.id}
              onChange={() => setPending(t.id)}
            />
            {swatches(t)}
            <span style={styles.name}>{t.name}</span>
          </span>
        </label>
      ))}

      <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button style={styles.btn} onClick={() => void save()} disabled={saving || pending === site.theme}>
          Save
        </button>
        {saving && <span>Сохранение…</span>}
      </div>

      {status && <div style={{ marginTop: '1rem' }}>{status}</div>}
      {loadError && <div style={{ marginTop: '1rem' }}>{loadError}</div>}
    </div>
  )
}
