'use client'

// Кастомный Cell для колонки name в списке forms — ссылка на конструктор формы.
// Payload 3 cell-компонент получает clientProps с rowData (весь doc).
export default function FormBuilderLink({ rowData }: { rowData?: { id?: string } }) {
  if (!rowData?.id) return null
  return <a href={`/form-builder?form=${rowData.id}`} target="_self" rel="noreferrer">В builder →</a>
}
