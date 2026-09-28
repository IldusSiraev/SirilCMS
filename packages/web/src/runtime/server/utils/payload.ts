export async function payloadGet<T>(path: string, opts?: { token?: string }): Promise<T> {
  const { PAYLOAD_URL } = useRuntimeConfig()
  const headers = opts?.token ? { Authorization: `JWT ${opts.token}` } : undefined
  return $fetch<T>(`${PAYLOAD_URL}/api/${path}`, headers ? { headers } : undefined) as Promise<T>
}
