// Приёмка extension API (phase B): пример-проект с блоком `cases`, темой `client` и коллекцией `cases`
// работает end-to-end — admin принимает контент проектного блока, web рендерит его проектным компонентом
// и подключает CSS проектной темы. Требует запущенные admin (:3001) и web (:3000) на одной пустой БД,
// первый пользователь самозаписывается (DISABLE_FIRST_USER_SIGNUP не задан).
const ADMIN = process.env.ADMIN_URL ?? 'http://localhost:3001'
const WEB = process.env.WEB_URL ?? 'http://localhost:3000'
const SLUG = `cases-${Date.now()}`

const j = { 'content-type': 'application/json' }
const api = async (path, init = {}) => {
  const res = await fetch(`${ADMIN}/api/${path}`, init)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status} ${JSON.stringify(body).slice(0, 300)}`)
  return body
}
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` ${extra}`}`)
  if (!ok) process.exitCode = 1
}

const creds = { email: 'owner@example.test', password: 'example-password-123' }
await api('users', { method: 'POST', headers: j, body: JSON.stringify({ ...creds, name: 'Example Owner' }) }).catch(() => {})
const { token } = await api('users/login', { method: 'POST', headers: j, body: JSON.stringify(creds) })
const auth = { ...j, authorization: `JWT ${token}` }

const site = (await api('sites', { method: 'POST', headers: auth, body: JSON.stringify({ name: 'Example', slug: `ex-${Date.now()}`, domain: new URL(WEB).host, theme: 'client' }) })).doc
check('site with project theme "client" accepted by admin', site.theme === 'client')

const caseDoc = await api('cases', { method: 'POST', headers: auth, body: JSON.stringify({ title: 'First case', site: site.id }) })
check('project collection "cases" works', caseDoc.doc?.title === 'First case')

await api('pages', {
  method: 'POST',
  headers: auth,
  body: JSON.stringify({
    site: site.id,
    title: 'Cases page',
    slug: SLUG,
    _status: 'published',
    sections: [
      { blockType: 'cases', variant: 'card', title: 'Our cases', items: [{ value: 'Case Alpha' }, { value: 'Case Beta' }] },
      { blockType: 'cta', variant: 'default', title: 'Core CTA still works' },
    ],
  }),
})
check('project block "cases" accepted in pages.sections', true)

const html = await (await fetch(`${WEB}/${SLUG}`)).text()
check('web renders project block with the project component (.cases-block)', html.includes('cases-block') && html.includes('Our cases'))
check('project block data rendered', html.includes('Case Alpha') && html.includes('Case Beta'))
check('core block next to it still renders', html.includes('Core CTA still works'))
check('project theme CSS (themes/client/tokens.css) injected in <head>', html.includes('siril-example-client-theme'))
check('project theme token applied inline by the block', html.includes('#b91c1c'))
check('no placeholder fallback for the project block', !/placeholder/i.test(html.split('cases-block')[0].slice(-400)))
if (process.exitCode) console.error('\nverify: FAILED')
else console.log('\nverify: all checks passed')
