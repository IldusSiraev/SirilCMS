<script setup lang="ts">
const err = useError()
const is404 = computed(() => err.value?.statusCode === 404)
</script>

<template>
  <div class="app error-app">
    <main class="site-main">
      <div v-if="is404" class="notfound">
        <h1>404</h1>
        <p>
          Страница не найдена. <NuxtLink to="/">На главную</NuxtLink>
        </p>
      </div>
      <div v-else class="notfound">
        <h1>{{ err?.statusCode }}</h1>
        <p>{{ err?.statusMessage }}</p>
        <p><NuxtLink to="/">На главную</NuxtLink></p>
      </div>
    </main>
  </div>
</template>

<style>
.error-app { min-height: 100vh; }
.error-app .site-main { padding: 2rem; }
.error-app a { color: #2563eb; text-decoration: underline; }
</style>
