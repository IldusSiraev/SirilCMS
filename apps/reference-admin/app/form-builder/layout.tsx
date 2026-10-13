// Корневой layout только для /form-builder (Next 16: несколько root layout допустимы —
// (payload) и (frontend) группы уже несут свои <html>). Payload UI через app-router
// не ходит — layout нужен для кастомной страницы; сторонних css по брифу нет.
export default function FormBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          color: '#111827',
          background: '#ffffff',
        }}
      >
        {children}
      </body>
    </html>
  )
}
