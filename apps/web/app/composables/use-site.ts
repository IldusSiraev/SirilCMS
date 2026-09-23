export const useSite = () =>
  useAsyncData<{ site: any; content: any }>('site', () => $fetch('/api/site'), { server: true })
