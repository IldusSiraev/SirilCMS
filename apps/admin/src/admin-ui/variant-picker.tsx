'use client'

import { useField, useTranslation } from '@payloadcms/ui'
import { getTranslation } from '@payloadcms/translations'

// Визуальный пикер варианта блока — заменяет select на карточки с превью-SVG
// (wireframe варианта, см. packages/blocks-definitions/src/variant-preview.ts).
// Полная замена admin.components.Field не получает value/onChange пропами
// (это API внутренних под-компонентов select-поля) — состояние читаем/пишем
// через useField, как и любой другой кастомный Field-компонент Payload.
type VariantPreview = { value: string; label: string; svg: string }

type Props = {
  field: { label?: Record<string, string> | string; admin?: { custom?: { variantPreviews?: VariantPreview[] } } }
  path: string
}

export default function VariantPickerField({ field, path }: Props) {
  const { setValue, value } = useField<string>({ path })
  const { i18n } = useTranslation()
  const previews = field.admin?.custom?.variantPreviews ?? []
  const label = field.label ? getTranslation(field.label, i18n) : 'Вариант'
  return (
    <div className="field-type variant-picker">
      <label className="field-label">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {previews.map((p) => {
          const selected = value === p.value
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => setValue(p.value)}
              aria-pressed={selected}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: 8,
                borderRadius: 8,
                cursor: 'pointer',
                border: selected ? '2px solid #2563eb' : '1px solid #d1d5db',
                background: selected ? '#eff6ff' : '#fff',
              }}
            >
              <img
                src={`data:image/svg+xml,${encodeURIComponent(p.svg)}`}
                alt={p.label}
                width={120}
                height={72}
                style={{ borderRadius: 4, display: 'block' }}
              />
              <span style={{ fontSize: 12 }}>{p.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
