<script setup lang="ts">
import { ref } from 'vue'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

const props = withDefaults(
  defineProps<{
    type?: AlertType
    dismissible?: boolean
  }>(),
  {
    type: 'info',
    dismissible: false,
  },
)

const visible = ref(true)

const typeClasses: Record<AlertType, string> = {
  success: 'bg-success-50 border-success-200 text-success-800',
  error: 'bg-danger-50 border-danger-200 text-danger-800',
  warning: 'bg-warning-50 border-warning-200 text-warning-800',
  info: 'bg-primary-50 border-primary-200 text-primary-800',
}

const iconPaths: Record<AlertType, string> = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible"
      :class="[
        'flex items-start gap-3 rounded-[var(--radius-card)] border p-4',
        typeClasses[type],
      ]"
    >
      <svg
        class="h-5 w-5 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path :d="iconPaths[type]" />
      </svg>

      <div class="flex-1 text-sm">
        <slot />
      </div>

      <button
        v-if="dismissible"
        class="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
        @click="visible = false"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>
