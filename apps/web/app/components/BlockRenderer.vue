<template>
  <component :is="resolved" :block="block" :theme-id="themeId" />
</template>
<script setup lang="ts">
import type { BlockDef } from '@siril/blocks-definitions'
import { getBlock, getTheme, resolveVariant } from '@siril/blocks-definitions'
import { getBlockComponent } from '../blocks/registry'

const props = defineProps<{ block: any; themeId: string }>()
const type = props.block.blockType ?? props.block.type
const def: BlockDef | undefined = getBlock(type)
const fallbackDef: BlockDef = {
  type: type,
  name: type,
  variants: [{ id: 'default', name: 'Default', fields: [] }],
}
const r = resolveVariant(
  getTheme(props.themeId),
  def ?? fallbackDef,
  props.block.variant,
)
const resolved = getBlockComponent(type, r.variant)
</script>
