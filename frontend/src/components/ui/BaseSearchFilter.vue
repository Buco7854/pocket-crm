<script setup lang="ts">
import { useI18n } from 'vue-i18n'

export interface FilterOption {
  key: string
  labelKey: string
  options: { value: string; label: string }[]
}

defineProps<{
  searchQuery: string
  filters?: FilterOption[]
  filterValues?: Record<string, string>
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:filterValues': [values: Record<string, string>]
}>()

const { t } = useI18n()

function updateFilter(key: string, value: string) {
  emit('update:filterValues', {
    ...(arguments[2] || {}),
    [key]: value,
  })
}
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-3">
    <!-- Search -->
    <div class="relative flex-1">
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        :value="searchQuery"
        type="text"
        :placeholder="t('common.search')"
        class="w-full h-9 rounded-[var(--radius-input)] border border-surface-200 bg-surface-0 pl-10 pr-4 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Filters -->
    <div v-if="filters?.length" class="flex gap-2 flex-wrap">
      <select
        v-for="filter in filters"
        :key="filter.key"
        :value="filterValues?.[filter.key] || ''"
        class="h-9 rounded-[var(--radius-input)] border border-surface-200 bg-surface-0 px-3 pr-8 text-sm text-surface-700 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        @change="updateFilter(filter.key, ($event.target as HTMLSelectElement).value)"
      >
        <option value="">{{ t(filter.labelKey) }}</option>
        <option
          v-for="opt in filter.options"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>
  </div>
</template>
