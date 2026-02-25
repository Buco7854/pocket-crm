<script setup lang="ts" generic="T extends Record<string, unknown>">
import { useI18n } from 'vue-i18n'

export interface TableColumn<T> {
  key: keyof T & string
  labelKey: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn<T>[]
    data: T[]
    loading?: boolean
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    rowKey?: keyof T & string
  }>(),
  {
    loading: false,
    sortDir: 'asc',
    rowKey: 'id' as never,
  },
)

const emit = defineEmits<{
  sort: [key: string]
  rowClick: [row: T]
}>()

const { t } = useI18n()

function handleSort(col: TableColumn<T>) {
  if (col.sortable) emit('sort', col.key)
}
</script>

<template>
  <div class="overflow-hidden rounded-[var(--radius-card)] border border-surface-200 bg-surface-0">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-200 bg-surface-50">
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                col.sortable && 'cursor-pointer select-none hover:text-surface-700 transition-colors',
              ]"
              :style="col.width ? { width: col.width } : undefined"
              @click="handleSort(col)"
            >
              <div class="flex items-center gap-1.5" :class="col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''">
                {{ t(col.labelKey) }}
                <svg
                  v-if="col.sortable && sortBy === col.key"
                  class="h-3.5 w-3.5 transition-transform"
                  :class="sortDir === 'desc' && 'rotate-180'"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path d="m5 15 7-7 7 7" />
                </svg>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr v-for="i in 5" :key="i" class="border-b border-surface-100">
              <td v-for="col in columns" :key="col.key" class="px-4 py-3">
                <div class="skeleton h-4 w-3/4" />
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length" class="px-4 py-12 text-center">
              <div class="flex flex-col items-center gap-2 text-surface-400">
                <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p class="text-sm">{{ t('common.noResults') }}</p>
              </div>
            </td>
          </tr>

          <!-- Data rows -->
          <template v-else>
            <tr
              v-for="row in data"
              :key="String(row[rowKey])"
              class="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors cursor-pointer"
              @click="emit('rowClick', row)"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                :class="[
                  'px-4 py-3 text-surface-700',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                ]"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
