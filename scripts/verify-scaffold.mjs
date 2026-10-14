// Приёмка проекта, созданного create-siril: admin (:3001) и web (:3000) на пустой БД — первый пользователь
// самозаписывается, создаётся сайт и страница с блоком ядра, web должен её отрендерить.
const ADMIN = process.env.ADMIN_URL ?? 'http://localhost:3001'
const WEB = process.env.WEB_URL ?? 'http://localhost:3000'
const j = { 'content-type': 'application/json' }
const api = async (path, init = {}) => {
  const res = await fetch(`${ADMIN}/api/${path}`, init)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status} ${JSON.stringify(body).slice(0, 200)}`)
  return body
}
const creds = { email: 'owner@scaffold.test', password: 'scaffold-password-123' }
await api('users', { method: 'POST', headers: j, body: JSON.stringify({ ...creds, name: 'Owner' }) })
const { token } = await api('users/login', { method: 'POST', headers: j, body: JSON.stringify(creds) })
const auth = { ...j, authorization: `JWT ${token}` }
const site = (await api('sites', { method: 'POST', headers: auth, body: JSON.stringify({ name: 'Acme', slug: 'acme', domain: 'localhost:3000' }) })).doc
const slug = `hello-${Date.now()}`
await api('pages', { method: 'POST', headers: auth, body: JSON.stringify({ site: site.id, title: 'Hello', slug, _status: 'published', sections: [{ blockType: 'cta', variant: 'default', title: 'Scaffolded CTA works' }] }) })
const html = await (await fetch(`${WEB}/${slug}`)).text()
const ok = html.includes('Scaffolded CTA works')
console.log(ok ? 'ok   scaffolded project: admin → page → web renders core block' : 'FAIL page not rendered')
const health = await fetch(`${WEB}/api/health`)
console.log(health.ok ? 'ok   web health' : 'FAIL web health')
process.exit(ok && health.ok ? 0 : 1)
