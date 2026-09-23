<template>
  <div class="app">
    <header class="site-header">
      <nav>
        <a
          v-for="it in nav"
          :key="it.label"
          :href="href(it)"
          :target="it.externalUrl ? '_blank' : undefined"
          :rel="it.externalUrl ? 'noopener' : undefined"
          >{{ it.label }}</a
        >
      </nav>
    </header>
    <main class="site-main"><slot /></main>
    <footer class="site-footer">
      <p v-if="footer?.text">{{ footer.text }}</p>
      <p v-if="hasContacts">
        <a v-if="footer?.email" :href="'mailto:' + footer.email">{{ footer.email }}</a>
        <a v-if="footer?.phone" :href="'tel:' + footer.phone">{{ footer.phone }}</a>
        <a v-if="footer?.telegram" :href="'https://t.me/' + footer.telegram" target="_blank" rel="noopener">Telegram</a>
        <a v-for="s in footer?.social ?? []" :key="s.value" :href="s.value" target="_blank" rel="noopener">{{ s.value }}</a>
      </p>
    </footer>
  </div>
</template>
<script setup lang="ts">
const { data } = await useSite()
const nav = computed(() => data.value?.content?.navigation ?? [])
const footer = computed(() => data.value?.content?.footer ?? null)
const hasContacts = computed(
  () => !!(footer.value?.email || footer.value?.phone || footer.value?.telegram || (footer.value?.social?.length ?? 0)),
)
const href = (it: any) => {
  if (it.externalUrl) return it.externalUrl
  if (it.page?.slug) return `/${it.page.slug}`
  if (it.page != null && typeof it.page === 'string') return `/${it.page}`
  return '/'
}
</script>
<style>
:root { color-scheme: light; }
body { margin: 0; font-family: system-ui, sans-serif; }
.site-header nav { display: flex; gap: 1rem; padding: 1rem 2rem; border-bottom: 1px solid #e5e7eb; }
.site-main { padding: 2rem; min-height: 50vh; }
.site-footer { padding: 2rem; border-top: 1px solid #e5e7eb; color: #6b7280; }
.site-footer p { margin: 0.25rem 0; }
a { text-decoration: none; }
</style>
