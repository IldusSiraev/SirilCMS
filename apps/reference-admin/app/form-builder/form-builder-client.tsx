'use client'

import { useCallback, useEffect, useState } from 'react'

// 11 типов полей формы; источник списка: packages/blocks-definitions/src/form-fields.ts (FORM_FIELD_TYPES)
const TYPES = [
  'text', 'email', 'tel', 'textarea', 'select', 'checkbox',
  'checkbox-group', 'date', 'file', 'consent', 'honeypot',
]

type Row = {
  name: string
  label: string
  type: string
  required: boolean
  placeholder: string
  options: string
}

const rowOf = (r: Record<string, unknown> | undefined): Row => ({
  name: String(r?.name ?? ''),
  label: String(r?.label ?? ''),
  type: String(r?.type ?? 'text'),
  required: !!r?.required,
  placeholder: String(r?.placeholder ?? ''),
  options: String(r?.options ?? ''),
})

const emptyDraft = { name: '', label: '', type: 'text', required: false, placeholder: '', options: '' }

const styles = {
  wrap: { padding: '1.5rem 2rem', maxWidth: '720px' } as const,
  row: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' } as const,
  label: { flex: 1 } as const,
  btn: { cursor: 'pointer' } as const,
  input: { padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', display: 'block', width: '100%', boxSizing: 'border-box' as const } as const,
  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '0.75rem 0' } as const,
}

// Кастомная страница конструктора полей формы. Данные — Payload REST на том же origin
// (относительные fetch-пути, cookie сессии уходят сами). Save — PATCH с телом { fields }.
export default function FormBuilderClient({ formId }: { formId: string }) {
  const [formName, setFormName] = useState('')
  const [fields, setFields] = useState<Row[] | null>(null)
  const [status, setStatus] = useState('')
  const [draft, setDraft] = useState({ ...emptyDraft })

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`)
      const json = (await res.json()) as {
        name?: string
        fields?: Array<Record<string, unknown>>
        errors?: Array<{ message?: string }>
        message?: string
      }
      if (!res.ok) {
        throw new Error(json?.errors?.[0]?.message ?? json?.message ?? `HTTP ${res.status}`)
      }
      setFormName(json?.name ?? '')
      setFields((json?.fields ?? []).map(rowOf))
      setStatus('')
    } catch (e) {
      setStatus(`Ошибка загрузки: ${(e as Error).message}`)
    }
  }, [formId])

  useEffect(() => {
    void load()
  }, [load])

  const move = (index: number, dir: -1 | 1) => {
    setFields((prev) => {
      if (!prev) return prev
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const remove = (index: number) => {
    setFields((prev) => (prev ? prev.filter((_, i) => i !== index) : prev))
  }

  const addRow = () => {
    if (!draft.name || !draft.label) {
      setStatus('Поле добавления: заполните name и label')
      return
    }
    setFields((prev) => [...(prev ?? []), { ...draft }])
    setDraft({ ...emptyDraft })
    setStatus('')
  }

  const save = async () => {
    if (!fields) return
    setStatus('')
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      })
      const json = (await res.json()) as {
        errors?: Array<{ message?: string }>
        message?: string
      }
      if (!res.ok) {
        throw new Error(json?.errors?.[0]?.message ?? json?.message ?? `HTTP ${res.status}`)
      }
      setStatus('Сохранено')
      await load()
    } catch (e) {
      setStatus(`Ошибка сохранения: ${(e as Error).message}`)
    }
  }

  return (
    <div style={styles.wrap}>
      <h1 style={{ marginTop: 0 }}>Form builder: {formName}</h1>

      {fields === null && <div>Загрузка…</div>}

      {fields?.map((f, i) => (
        <div key={`${f.name}-${i}`} style={styles.row}>
          <span style={styles.label}>
            {f.label} · {f.type}
            {f.required ? ' *' : ''}
          </span>
          <button style={styles.btn} onClick={() => move(i, -1)} title="Вверх">↑</button>
          <button style={styles.btn} onClick={() => move(i, 1)} title="Вниз">↓</button>
          <button style={styles.btn} onClick={() => remove(i)} title="Удалить">✕</button>
        </div>
      ))}

      <div style={{ marginTop: '1.25rem' }}>
        <strong>Добавить поле</strong>
        <div style={styles.fieldGrid}>
          <input
            style={styles.input}
            placeholder="name (ключ)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="label (подпись)"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
          <select
            style={styles.input}
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="checkbox"
              checked={draft.required}
              onChange={(e) => setDraft({ ...draft, required: e.target.checked })}
            />
            required
          </label>
          <textarea
            style={{ ...styles.input, gridColumn: '1 / -1', minHeight: '3rem' }}
            placeholder="options (одна на строку, для select)"
            value={draft.options}
            onChange={(e) => setDraft({ ...draft, options: e.target.value })}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{ ...styles.btn, padding: '0.4rem 0.9rem' }} onClick={addRow}>
            Add
          </button>
          <button style={{ ...styles.btn, padding: '0.4rem 0.9rem' }} onClick={() => void save()}>
            Save
          </button>
          <a
            style={{
              ...styles.btn,
              padding: '0.4rem 0.9rem',
              display: 'inline-block',
              textDecoration: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
            }}
            href={`/api/submissions-csv?form=${formId}`}
            target="_blank"
            rel="noreferrer"
          >
            Экспорт CSV
          </a>
        </div>
      </div>

      {status && <div style={{ marginTop: '1rem' }}>{status}</div>}
    </div>
  )
}
