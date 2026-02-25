<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const breadcrumbs = computed(() => {
  return (route.meta.breadcrumb as { labelKey: string; to?: string }[]) || []
})
</script>

<template>
  <nav class="flex items-center gap-1.5 text-sm">
    <template v-for="(crumb, index) in breadcrumbs" :key="index">
      <svg
        v-if="index > 0"
        class="h-4 w-4 text-surface-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
      <button
        v-if="crumb.to && index < breadcrumbs.length - 1"
        class="text-surface-500 hover:text-primary-600 transition-colors"
        @click="router.push(crumb.to)"
      >
        {{ t(crumb.labelKey) }}
      </button>
      <span v-else class="font-medium text-surface-900">
        {{ t(crumb.labelKey) }}
      </span>
    </template>
  </nav>
</template>
