import FormBuilderClient from './form-builder-client'

// Server component: id формы приходит в query (?form=<id>). Next 16: searchParams — Promise.
export default async function FormBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { form } = await searchParams

  if (!form) {
    return (
      <div style={{ padding: '2rem', fontSize: '1rem' }}>
        <h1 style={{ marginTop: 0 }}>Form builder</h1>
        <p>
          Укажите id формы в query: <code>/form-builder?form=&lt;id&gt;</code>.
        </p>
        <p>
          <a href="/admin">Список форм — в админке →</a>
        </p>
      </div>
    )
  }

  return <FormBuilderClient formId={form} />
}
