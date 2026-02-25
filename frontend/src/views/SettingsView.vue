<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-surface-900 font-display">{{ t('nav.settings') }}</h1>
  </div>
</template>
