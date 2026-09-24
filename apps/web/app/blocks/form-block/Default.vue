<template>
  <section class="formblock" :style="tokens">
    <form @submit.prevent="submit">
      <template v-for="ff in fields" :key="ff.name">
        <div v-if="ff.type !== 'honeypot' && ff.type !== 'file'" class="formblock-field">
          <label class="formblock-label">{{ ff.label }} <span v-if="ff.required">*</span></label>
          <input v-if="ff.type === 'text' || ff.type === 'email' || ff.type === 'tel'" :type="ff.type" v-model="values[ff.name]" :required="!!ff.required" :placeholder="ff.placeholder" />
          <textarea v-else-if="ff.type === 'textarea'" v-model="values[ff.name]" :required="!!ff.required" :placeholder="ff.placeholder" rows="4"></textarea>
          <select v-else-if="ff.type === 'select'" v-model="values[ff.name]" :required="!!ff.required">
            <option value="">—</option>
            <option v-for="o in options(ff)" :key="o" :value="o">{{ o }}</option>
          </select>
          <input v-else-if="ff.type === 'date'" type="date" v-model="values[ff.name]" :required="!!ff.required" />
          <label v-else-if="ff.type === 'checkbox'" class="formblock-check">
            <input type="checkbox" v-model="checks[ff.name]" :required="!!ff.required" />
            <span v-if="ff.placeholder">{{ ff.placeholder }}</span>
          </label>
          <div v-else-if="ff.type === 'checkbox-group'" class="formblock-group">
            <label v-for="o in options(ff)" :key="o" class="formblock-check">
              <input type="checkbox" v-model="groups[ff.name]" :value="o" />
              <span>{{ o }}</span>
            </label>
          </div>
          <label v-else-if="ff.type === 'consent'" class="formblock-check">
            <input type="checkbox" v-model="consents[ff.name]" :required="!!ff.required" />
          </label>
        </div>
        <label v-else-if="ff.type === 'honeypot'" class="formblock-hp" aria-hidden="true">
          <input type="text" tabindex="-1" autocomplete="off" v-model="values[ff.name]" />
        </label>
      </template>
      <button type="submit">Отправить</button>
      <p v-if="errors" class="formblock-errors">{{ errors }}</p>
      <p v-else-if="success" class="formblock-success">{{ successMessage }}</p>
    </form>
  </section>
</template>
<script setup lang="ts">
import { getTheme } from '@siril/blocks-definitions'
import { payloadGet } from '../../../server/utils/payload'

const props = defineProps<{ block: any; themeId: string }>()
const theme = getTheme(props.themeId)
const tokens = Object.fromEntries(Object.entries(theme.tokens))

const formId = typeof props.block.form === 'object' ? props.block.form?.id : props.block.form
const { data } = await useAsyncData(`form-${formId}`, () =>
  payloadGet<{ docs: any[] }>(`forms?where[id][equals]=${formId ?? 1}&depth=2`),
)
const form = computed(() => data.value?.docs?.[0] ?? null)
const fields = computed(() => (form.value?.fields ?? []) as any[])
const successMessage = computed(() => form.value?.successMessage || 'Спасибо! Заявка отправлена.')

const values = reactive<Record<string, string>>({})
const checks = reactive<Record<string, boolean>>({})
const groups = reactive<Record<string, string[]>>({})
const consents = reactive<Record<string, boolean>>({})
const errors = ref('')
const success = ref(false)

const options = (ff: any): string[] => (ff.options ? String(ff.options).split('\n').filter(Boolean) : [])

const submit = async () => {
  errors.value = ''
  success.value = false
  const f = form.value
  if (!f) return
  const payload: Record<string, string> = { ...values }
  Object.keys(checks).forEach(k => (payload[k] = checks[k] ? 'true' : ''))
  Object.keys(groups).forEach(k => (payload[k] = (groups[k] ?? []).join(', ')))
  Object.keys(consents).forEach(k => (payload[k] = consents[k] ? 'true' : ''))
  try {
    const res = await $fetch<{ ok: boolean; errors?: string[] }>(`/api/forms/${f.slug}/submit`, { method: 'POST', body: payload })
    if (!res.ok) {
      errors.value = (res.errors ?? []).join(' ')
    } else {
      Object.keys(values).forEach(k => (values[k] = ''))
      Object.keys(checks).forEach(k => (checks[k] = false))
      Object.keys(groups).forEach(k => (groups[k] = []))
      Object.keys(consents).forEach(k => (consents[k] = false))
      success.value = true
    }
  } catch (e: any) {
    errors.value = e?.statusMessage ?? 'Ошибка'
  }
}
</script>
<style>
.formblock { padding: 2rem; max-width: 72rem; margin: 0 auto; }
.formblock-field { display: block; margin-bottom: 1rem; max-width: 32rem; }
.formblock-label { display: block; margin-bottom: .25rem; color: var(--c-text, #111); }
.formblock input, .formblock textarea, .formblock select { padding: .5rem .75rem; border: 1px solid #d1d5db; border-radius: var(--radius, .5rem); font: inherit; }
.formblock-check { display: inline-flex; align-items: center; gap: .5rem; }
.formblock-group { display: flex; flex-direction: column; gap: .25rem; }
.formblock-hp { position: absolute; left: -9999px; }
.formblock button { padding: .75rem 1.5rem; border: 0; border-radius: var(--radius, .5rem); background: var(--c-primary, #0f766e); color: #fff; cursor: pointer; }
.formblock-errors { color: #b91c1c; }
.formblock-success { color: #0f766e; }
</style>
