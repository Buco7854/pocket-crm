<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()

const isAuthLayout = computed(() => route.meta.layout === 'auth')
</script>

<template>
  <template v-if="isAuthLayout">
    <router-view />
  </template>
  <AppLayout v-else />
</template>
