<template>
  <div v-if="home">
    <BlockRenderer v-for="b in sections" :key="b._id ?? `${b.type}:${b.variant}`" :block="b" :theme-id="themeId" />
  </div>
</template>
<script setup lang="ts">
const { data } = await useSite()
const themeId = data.value?.site?.theme ?? 'default'

const { data: homeRes } = await useAsyncData('home-page', () => $fetch<{ page: any }>('/api/page?slug=home'))
const home = homeRes.value?.page
if (!home) throw createError({ statusCode: 404, message: 'Home not found' })

const sections = (home.sections as any[]) ?? []

useHead({ title: home.seo?.title ?? home.title, htmlAttrs: { lang: 'ru' } })
if (home.seo) {
  useSeoMeta({
    title: home.seo.title || home.title,
    description: home.seo.description,
    ogImage: home.seo.ogImage ? `http://${data.value!.site.domain}/media/${home.seo.ogImage}` : undefined,
    canonical: home.seo.canonical || `http://${data.value!.site.domain}/`,
  })
  if (home.seo.noindex) useHead({ script: [{ innerHTML: '<meta name="robots" content="noindex">' }] as any })
}
</script>
