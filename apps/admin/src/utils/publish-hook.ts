export function publishHook(_type: string, _id: number, siteId: number) {
  const nuxt = process.env.NUXT_URL ?? 'http://localhost:3000'
  const token = process.env.PURGE_TOKEN ?? 'dev-purge-token'
  fetch(`${nuxt}/api/purge`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ siteId }),
  }).catch(() => {})
}
