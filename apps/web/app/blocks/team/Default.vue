<template>
  <section class="team-block" :style="tokens">
    <h2 class="team-title">{{ block.title }}</h2>
    <div class="team-grid">
      <div v-for="(m, idx) in members" :key="idx" class="team-card">
        <img v-if="m.photoSrc" :src="m.photoSrc" :alt="m.name || ''" loading="lazy" class="team-photo">
        <div class="team-name">
          <a v-if="m.link" :href="m.link" :target="isExternal(m.link) ? '_blank' : undefined" :rel="isExternal(m.link) ? 'noopener' : undefined">{{ m.name }}</a>
          <span v-else>{{ m.name }}</span>
        </div>
        <div v-if="m.role" class="team-role">{{ m.role }}</div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))
const members = computed(() =>
  (props.block.members ?? []).map((m: any) => ({
    ...m,
    photoSrc: mediaUrl(m.photo),
  })),
)
const isExternal = (l: string) => typeof l === 'string' && l.startsWith('http')
</script>
<style>
.team-block { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.team-title { text-align: center; margin-bottom: 1.5rem; color: var(--c-primary, #111); }
.team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
.team-card { text-align: center; padding: 1rem; border-radius: .5rem; background: var(--c-surface, #f5f5f5); }
.team-photo { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; margin-bottom: .75rem; }
.team-name { font-weight: 600; }
.team-role { font-size: .875rem; opacity: .8; }
@media (max-width: 640px) { .team-grid { grid-template-columns: 1fr; } }
</style>
