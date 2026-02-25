<script setup lang="ts">
withDefaults(
  defineProps<{
    hoverable?: boolean
    padding?: boolean
  }>(),
  {
    hoverable: false,
    padding: true,
  },
)
</script>

<template>
  <div
    :class="[
      'rounded-[var(--radius-card)] border border-surface-200 bg-surface-0 shadow-card transition-all duration-200',
      hoverable && 'hover:shadow-card-hover hover:-translate-y-0.5',
    ]"
  >
    <!-- Header -->
    <div v-if="$slots.header" class="px-5 py-4 border-b border-surface-100">
      <slot name="header" />
    </div>

    <!-- Body -->
    <div :class="padding ? 'px-5 py-4' : ''">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="px-5 py-3 border-t border-surface-100 bg-surface-50 rounded-b-[var(--radius-card)]">
      <slot name="footer" />
    </div>
  </div>
</template>
