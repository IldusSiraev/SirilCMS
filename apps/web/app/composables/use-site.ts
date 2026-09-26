export const useSite = () => {
  const host = useRequestURL().host
  return useAsyncData<{ site: any; content: any }>(`site:${host}`, () =>
    $fetch('/api/site', { query: { host } }), { server: true })
}
