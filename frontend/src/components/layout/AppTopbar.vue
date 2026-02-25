<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppBreadcrumb from './AppBreadcrumb.vue'
import LocaleSwitcher from './LocaleSwitcher.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'

defineProps<{
  sidebarCollapsed: boolean
}>()

const emit = defineEmits<{
  openMobileSidebar: []
}>()

const { t } = useI18n()
const router = useRouter()
const { user, userInitials, userRole, logout } = useAuth()

const searchQuery = ref('')
const userMenuOpen = ref(false)

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function closeUserMenu() {
  // Small delay so clicks inside the menu register before closing
  setTimeout(() => {
    userMenuOpen.value = false
  }, 150)
}

function goToSettings() {
  userMenuOpen.value = false
  router.push('/settings')
}

function handleLogout() {
  userMenuOpen.value = false
  logout()
}
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-surface-200 bg-surface-0/80 backdrop-blur-xl px-4 lg:px-6 transition-all duration-300',
      sidebarCollapsed ? 'lg:pl-[calc(68px+1.5rem)]' : 'lg:pl-[calc(15rem+1.5rem)]',
    ]"
  >
    <!-- Mobile hamburger -->
    <button
      class="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
      @click="emit('openMobileSidebar')"
    >
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12h18M3 6h18M3 18h18" />
      </svg>
    </button>

    <!-- Breadcrumb -->
    <AppBreadcrumb class="hidden sm:flex" />

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Search -->
    <div class="relative hidden md:block">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('common.search')"
        class="h-9 w-64 rounded-lg border border-surface-200 bg-surface-50 pl-10 pr-4 text-sm text-surface-700 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all dark:bg-surface-100 dark:border-surface-200 dark:text-surface-800"
      />
      <kbd class="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 rounded border border-surface-200 bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-400">
        ⌘K
      </kbd>
    </div>

    <!-- Theme & Locale -->
    <ThemeSwitcher />
    <LocaleSwitcher />

    <!-- User menu -->
    <div class="relative">
      <button
        class="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-100 transition-colors"
        @click="toggleUserMenu"
        @blur="closeUserMenu"
      >
        <div class="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
          {{ userInitials }}
        </div>
      </button>

      <Transition name="fade">
        <div
          v-if="userMenuOpen"
          class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-surface-200 bg-surface-0 shadow-modal py-1"
        >
          <div class="px-4 py-3 border-b border-surface-100">
            <p class="text-sm font-medium text-surface-900">{{ user?.name }}</p>
            <p class="text-xs text-surface-500">{{ user?.email }}</p>
            <span
              v-if="userRole"
              class="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-50 text-primary-700"
            >
              {{ t(`roles.${userRole}`) }}
            </span>
          </div>
          <button
            class="flex w-full items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
            @mousedown.prevent="goToSettings"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm9.4-3.2a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V19a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></svg>
            {{ t('nav.settings') }}
          </button>
          <button
            class="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
            @mousedown.prevent="handleLogout"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9" /></svg>
            {{ t('auth.logout') }}
          </button>
        </div>
      </Transition>
    </div>
  </header>
</template>
