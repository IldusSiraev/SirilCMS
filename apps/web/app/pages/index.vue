<template>
  <div v-if="home">
    <BlockRenderer v-for="b in sections" :key="b.id ?? `${b.type}:${b.variant}`" :block="b" :theme-id="themeId" />
  </div>
</template>
<script setup lang="ts">
const { data } = await useSite()
const siteDomain = data.value?.site?.domain
const themeId = data.value?.site?.theme ?? 'default'

const { data: homeRes } = await useAsyncData('home-page', () => $fetch<{ page: any }>('/api/page?slug=home'))
const home = homeRes.value?.page
if (!home) throw createError({ statusCode: 404, message: 'Home not found' })

const sections = (home.sections ?? []) as any[]
const seo: any = home.seo
useSeoMeta({
  title: seo?.title || home.title,
  description: seo?.description,
  ogImage: seo?.ogImage?.filename ? `http://${siteDomain}/media/${seo.ogImage.filename}` : undefined,
  canonical: seo?.canonical || `http://${siteDomain}/`,
  robots: seo?.noindex ? 'noindex' : undefined,
})
useHead({ htmlAttrs: { lang: 'ru' } })
</script>
