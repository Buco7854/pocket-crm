<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    page: number
    totalPages: number
    totalItems: number
    perPage?: number
  }>(),
  {
    perPage: 20,
  },
)

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const { t } = useI18n()

const from = computed(() => (props.page - 1) * props.perPage + 1)
const to = computed(() => Math.min(props.page * props.perPage, props.totalItems))

const pages = computed(() => {
  const result: (number | '...')[] = []
  const total = props.totalPages
  const current = props.page

  if (total <= 7) {
    for (let i = 1; i <= total; i++) result.push(i)
  } else {
    result.push(1)
    if (current > 3) result.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      result.push(i)
    }
    if (current < total - 2) result.push('...')
    result.push(total)
  }

  return result
})
</script>

<template>
  <div class="flex items-center justify-between gap-4 text-sm">
    <p class="text-surface-500 hidden sm:block">
      {{ t('common.showing') }} <span class="font-medium text-surface-700">{{ from }}</span>
      {{ t('common.to') }} <span class="font-medium text-surface-700">{{ to }}</span>
      {{ t('common.of') }} <span class="font-medium text-surface-700">{{ totalItems }}</span>
      {{ t('common.items') }}
    </p>

    <div class="flex items-center gap-1">
      <!-- Previous -->
      <button
        :disabled="page <= 1"
        class="flex items-center justify-center h-8 w-8 rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="emit('update:page', page - 1)"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6" /></svg>
      </button>

      <!-- Page buttons -->
      <template v-for="(p, i) in pages" :key="i">
        <span v-if="p === '...'" class="flex items-center justify-center h-8 w-8 text-surface-400">
          &hellip;
        </span>
        <button
          v-else
          :class="[
            'flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium transition-colors',
            p === page
              ? 'bg-primary-600 text-white'
              : 'text-surface-600 hover:bg-surface-100',
          ]"
          @click="emit('update:page', p)"
        >
          {{ p }}
        </button>
      </template>

      <!-- Next -->
      <button
        :disabled="page >= totalPages"
        class="flex items-center justify-center h-8 w-8 rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="emit('update:page', page + 1)"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>
  </div>
</template>
