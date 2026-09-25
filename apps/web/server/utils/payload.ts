export async function payloadGet<T>(path: string): Promise<T> {
  const { PAYLOAD_URL } = useRuntimeConfig()
  return $fetch<T>(`${PAYLOAD_URL}/api/${path}`) as Promise<T>
}
