<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SupportedLocale } from '@/i18n'

const { locale } = useI18n()

function toggleLocale() {
  const next: SupportedLocale = locale.value === 'fr' ? 'en' : 'fr'
  locale.value = next
  localStorage.setItem('pocket-crm-locale', next)
}
</script>

<template>
  <button
    class="flex items-center justify-center h-9 w-9 rounded-lg text-sm font-semibold text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-all duration-200 uppercase tracking-wide"
    :title="locale === 'fr' ? 'Switch to English' : 'Passer en français'"
    @click="toggleLocale"
  >
    {{ locale === 'fr' ? 'EN' : 'FR' }}
  </button>
</template>
