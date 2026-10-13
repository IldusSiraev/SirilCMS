// Корневой layout только для /design (Next 16: несколько root layout допустимы —
// (payload) и (frontend) группы и form-builder уже несут свои <html>). Сторонних
// css по брифу нет.
export default function DesignLayout({ children }: { children: React.ReactNode }) {
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
