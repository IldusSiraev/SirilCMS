<template>
  <div v-if="page">
    <BlockRenderer v-for="b in sections" :key="b._id ?? `${b.type}:${b.variant}`" :block="b" :theme-id="themeId" />
  </div>
</template>
<script setup lang="ts">
const route = useRoute()
const slugParts = Array.isArray(route.params.slug) ? route.params.slug : [route.params.slug]
const slug = (slugParts as string[]).join('/')

const { data } = await useSite()
const themeId = data.value?.site?.theme ?? 'default'

const { data: pageRes } = await useAsyncData(`page:${slug}`, () =>
  $fetch<{ page: any }>(`/api/page?slug=${encodeURIComponent(slug)}`),
)
const page = pageRes.value?.page
if (!page) throw createError({ statusCode: 404, message: 'Not found' })

const sections = (page.sections as any[]) ?? []

useHead({ title: page.seo?.title ?? page.title, htmlAttrs: { lang: 'ru' } })
if (page.seo) {
  useSeoMeta({
    title: page.seo.title || page.title,
    description: page.seo.description,
    ogImage: page.seo.ogImage ? `http://${data.value!.site.domain}/media/${page.seo.ogImage}` : undefined,
    canonical: page.seo.canonical || `http://${data.value!.site.domain}/${slug}`,
  })
  if (page.seo.noindex) useHead({ script: [{ innerHTML: '<meta name="robots" content="noindex">' }] as any })
}
</script>
