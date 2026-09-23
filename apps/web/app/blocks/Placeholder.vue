<template>
  <div class="block-placeholder" data-fallback="true">
    [{{ $props.block?.type }} / {{ $props.block?.variant }}]
  </div>
</template>
<script setup lang="ts">
defineProps<{ block: any }>()
</script>
<style>
.block-placeholder {
  border: 1px dashed #ccc;
  color: #888;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
}
</style>
