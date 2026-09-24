<template>
  <div v-if="home">
    <BlockRenderer v-for="b in sections" :key="b.id ?? `${b.type}:${b.variant}`" :block="b" :theme-id="themeId" />
  </div>
</template>
<script setup lang="ts">
const { data } = await useSite()
const siteDomain = data.value?.site?.domain || useRuntimeConfig().public.SITE_DOMAIN
const base = `https://${siteDomain}`
const themeId = data.value?.site?.theme ?? 'default'

const { data: homeRes } = await useAsyncData('home-page', () => $fetch<{ page: any }>('/api/page?slug=home'))
const home = homeRes.value?.page
if (!home) throw createError({ statusCode: 404, message: 'Home not found' })

const sections = (home.sections ?? []) as any[]
const seo: any = home.seo
const canonical = seo?.canonical && /^https?:\/\/.+/.test(seo.canonical) ? seo.canonical : `${base}/`
useSeoMeta({
  title: seo?.title || home.title,
  description: seo?.description,
  ogImage: mediaUrl(seo?.ogImage) ?? undefined,
  canonical,
  robots: seo?.noindex ? 'noindex' : undefined,
})
useHead({ htmlAttrs: { lang: 'ru' } })
</script>
