<template>
  <div v-if="page">
    <BlockRenderer v-for="b in sections" :key="b.id ?? `${b.blockType ?? b.type}:${b.variant}`" :block="b" :theme-id="themeId" />
  </div>
</template>
<script setup lang="ts">
const route = useRoute()
const slugParts = Array.isArray(route.params.slug) ? route.params.slug : [route.params.slug]
const slug = (slugParts as string[]).join('/')
const token = String(route.query.token ?? '')

const { data } = await useSite()
const themeId = data.value?.site?.theme ?? 'default'

const { data: pageRes } = await useAsyncData(`preview-page:${slug}`, () =>
  $fetch<{ page: any }>(`/api/preview/page?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`),
)
const page = pageRes.value?.page
if (!page) throw createError({ statusCode: 404, message: 'Not found' })

const sections = (page.sections ?? []) as any[]
useHead({ htmlAttrs: { lang: data.value?.site?.locale ?? 'ru' }, meta: [{ name: 'robots', content: 'noindex' }] })
</script>
