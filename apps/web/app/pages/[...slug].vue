<template>
  <div v-if="page">
    <BlockRenderer v-for="b in sections" :key="b.id ?? `${b.blockType ?? b.type}:${b.variant}`" :block="b" :theme-id="themeId" />
  </div>
</template>
<script setup lang="ts">
const route = useRoute()
const slugParts = Array.isArray(route.params.slug) ? route.params.slug : [route.params.slug]
const slug = (slugParts as string[]).join('/')

const { data } = await useSite()
const siteDomain = data.value?.site?.domain || useRuntimeConfig().public.SITE_DOMAIN
const base = `https://${siteDomain}`
const themeId = data.value?.site?.theme ?? 'default'

const { data: pageRes } = await useAsyncData(`page:${slug}`, () =>
  $fetch<{ page: any }>(`/api/page?slug=${encodeURIComponent(slug)}`),
)
const page = pageRes.value?.page
if (!page) throw createError({ statusCode: 404, message: 'Not found' })

const sections = (page.sections ?? []) as any[]
const seo: any = page.seo
const canonical = seo?.canonical && /^https?:\/\/.+/.test(seo.canonical) ? seo.canonical : (slug === 'home' ? base : `${base}/${slug}`)
useSeoMeta({
  title: seo?.title || page.title,
  description: seo?.description,
  ogImage: mediaUrl(seo?.ogImage) ?? undefined,
  canonical,
  robots: seo?.noindex ? 'noindex' : undefined,
})
useHead({ htmlAttrs: { lang: 'ru' } })
</script>
