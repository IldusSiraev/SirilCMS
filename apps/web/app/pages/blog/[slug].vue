<template>
  <article v-if="post" class="post" :style="tokens">
    <h1>{{ post.title }}</h1>
    <img v-if="postCover" :src="postCover" class="post-cover" />
    <RichText :value="post.body" />
  </article>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const route = useRoute()
const { data: siteData } = await useSite()
const siteDomain = siteData.value?.site?.domain || useRuntimeConfig().SITE_DOMAIN
const base = `https://${siteDomain}`
const themeId = siteData.value?.site?.theme ?? 'default'
const theme = getTheme(themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))

const { data } = await useAsyncData(`post-${route.params.slug}`, () =>
  $fetch<{ post: any }>(`/api/post/${encodeURIComponent(String(route.params.slug))}`))
const post = computed(() => data.value?.post)
if (!post.value) throw createError({ statusCode: 404, message: 'Not found' })
const postCover = computed(() => mediaUrl(post.value?.cover))
const seo: any = post.value?.seo
const slug = String(route.params.slug)
const canonical = seo?.canonical && /^https?:\/\/.+/.test(seo.canonical) ? seo.canonical : `${base}/blog/${slug}`
useSeoMeta({
  title: post.value.title,
  description: post.value.excerpt ?? '',
  ogImage: mediaUrl(seo?.ogImage) ?? undefined,
  canonical,
  robots: seo?.noindex ? 'noindex' : undefined,
})
</script>
<style>
.post { padding: 2rem; max-width: 48rem; margin: 0 auto; }
.post h1 { color: var(--c-primary, #111); margin-bottom: 1rem; }
.post-cover { width: 100%; border-radius: .5rem; margin-bottom: 1.5rem; }
</style>
