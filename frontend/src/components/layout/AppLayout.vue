<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'

// Initialize theme on layout mount
useTheme()

const sidebarCollapsed = ref(false)
const mobileSidebarOpen = ref(false)

function toggleSidebarCollapse() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function openMobileSidebar() {
  mobileSidebarOpen.value = true
}

function closeMobileSidebar() {
  mobileSidebarOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-surface-50">
    <!-- Desktop sidebar -->
    <div class="hidden lg:block">
      <AppSidebar
        :collapsed="sidebarCollapsed"
        @toggle-collapse="toggleSidebarCollapse"
      />
    </div>

    <!-- Mobile sidebar overlay -->
    <Transition name="fade">
      <div
        v-if="mobileSidebarOpen"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
        @click="closeMobileSidebar"
      />
    </Transition>

    <!-- Mobile sidebar -->
    <Transition name="sidebar">
      <div v-if="mobileSidebarOpen" class="fixed inset-y-0 left-0 z-50 lg:hidden">
        <AppSidebar
          :collapsed="false"
          @toggle-collapse="closeMobileSidebar"
        />
      </div>
    </Transition>

    <!-- Main content area -->
    <div
      :class="[
        'transition-all duration-300 ease-[var(--ease-spring)]',
        sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-60',
      ]"
    >
      <AppTopbar
        :sidebar-collapsed="sidebarCollapsed"
        @open-mobile-sidebar="openMobileSidebar"
      />

      <main class="p-4 lg:p-6">
        <router-view v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>
    </div>
  </div>
</template>
