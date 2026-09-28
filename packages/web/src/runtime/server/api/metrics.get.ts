import { getCacheMetrics } from '../utils/metrics'

// Prometheus text exposition format (https://prometheus.io/docs/instrument/exposition_formats/).
// In-memory counters, reset on process restart — matches the existing in-memory page-cache/site
// caches in this app; a v1 pass, not meant to survive restarts or aggregate across replicas.
export default defineEventHandler((event) => {
  const { hits, misses } = getCacheMetrics()
  setHeader(event, 'content-type', 'text/plain; version=0.0.4; charset=utf-8')
  return (
    '# HELP siril_page_cache_hits_total Page cache hits since process start\n' +
    '# TYPE siril_page_cache_hits_total counter\n' +
    `siril_page_cache_hits_total ${hits}\n` +
    '# HELP siril_page_cache_misses_total Page cache misses since process start\n' +
    '# TYPE siril_page_cache_misses_total counter\n' +
    `siril_page_cache_misses_total ${misses}\n`
  )
})
