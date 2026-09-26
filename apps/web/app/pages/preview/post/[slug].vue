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
const token = String(route.query.token ?? '')
const { data: siteData } = await useSite()
const themeId = siteData.value?.site?.theme ?? 'default'
const theme = getTheme(themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))

const { data } = await useAsyncData(`preview-post:${route.params.slug}`, () =>
  $fetch<{ post: any }>(`/api/preview/post?slug=${encodeURIComponent(String(route.params.slug))}&token=${encodeURIComponent(token)}`))
const post = computed(() => data.value?.post)
if (!post.value) throw createError({ statusCode: 404, message: 'Not found' })
const postCover = computed(() => mediaUrl(post.value?.cover))
useHead({ htmlAttrs: { lang: siteData.value?.site?.locale ?? 'ru' }, meta: [{ name: 'robots', content: 'noindex' }] })
</script>
<style>
.post { padding: 2rem; max-width: 48rem; margin: 0 auto; }
.post h1 { color: var(--c-primary, #111); margin-bottom: 1rem; }
.post-cover { width: 100%; border-radius: .5rem; margin-bottom: 1.5rem; }
</style>
