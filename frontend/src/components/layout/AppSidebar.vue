<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggleCollapse: []
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

interface NavItem {
  key: string
  icon: string
  route: string
  roles?: string[]
}

const allMainNav: NavItem[] = [
  { key: 'dashboard', icon: 'grid', route: '/' },
  { key: 'contacts', icon: 'users', route: '/contacts' },
  { key: 'companies', icon: 'building', route: '/companies' },
  { key: 'leads', icon: 'trending-up', route: '/leads' },
  { key: 'pipeline', icon: 'columns', route: '/pipeline' },
  { key: 'tasks', icon: 'check-square', route: '/tasks' },
  { key: 'email', icon: 'mail', route: '/email', roles: ['admin', 'commercial'] },
]

const mainNav = computed(() =>
  allMainNav.filter((item) => {
    if (!item.roles) return true
    return auth.user ? item.roles.includes(auth.user.role) : false
  })
)

const bottomNav: NavItem[] = [
  { key: 'settings', icon: 'settings', route: '/settings' },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function navigate(path: string) {
  router.push(path)
}

const iconPaths = computed(() => ({
  grid: 'M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5zM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m21 0v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm5 0a3 3 0 0 0 0-6',
  building: 'M3 21h18M3 7v14m6-14v14m6-14v14m6-14v14M6 7h12l3 0M6 7l-3 0M9 11h0m0 4h0m6-4h0m0 4h0M6 3h12v4H6z',
  'trending-up': 'M23 6l-9.5 9.5-5-5L1 18m22-12h-7m7 0v7',
  columns: 'M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18',
  'check-square': 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm9.4-3.2a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V19a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
  'chevrons-left': 'M11 17l-5-5 5-5m7 10l-5-5 5-5',
  'chevrons-right': 'M13 17l5-5-5-5M6 17l5-5-5-5',
}))
</script>

<template>
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar transition-all duration-300 ease-[var(--ease-spring)]',
      collapsed ? 'w-[68px]' : 'w-60',
    ]"
  >
    <!-- Logo area -->
    <div class="flex h-16 items-center gap-3 px-4 border-b border-white/[0.06]">
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
        P
      </div>
      <Transition name="fade">
        <span v-if="!collapsed" class="font-display text-lg text-white tracking-tight">
          {{ t('app.name') }}
        </span>
      </Transition>
    </div>

    <!-- Main navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      <button
        v-for="item in mainNav"
        :key="item.key"
        :class="[
          'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive(item.route)
            ? 'bg-sidebar-active text-sidebar-text-active shadow-lg shadow-primary-600/20'
            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
        ]"
        @click="navigate(item.route)"
      >
        <svg
          class="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path :d="iconPaths[item.icon as keyof typeof iconPaths]" />
        </svg>
        <Transition name="fade">
          <span v-if="!collapsed">{{ t(`nav.${item.key}`) }}</span>
        </Transition>
      </button>
    </nav>

    <!-- Bottom section -->
    <div class="border-t border-white/[0.06] py-4 px-3 space-y-1">
      <button
        v-for="item in bottomNav"
        :key="item.key"
        :class="[
          'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive(item.route)
            ? 'bg-sidebar-active text-sidebar-text-active'
            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
        ]"
        @click="navigate(item.route)"
      >
        <svg
          class="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path :d="iconPaths[item.icon as keyof typeof iconPaths]" />
        </svg>
        <Transition name="fade">
          <span v-if="!collapsed">{{ t(`nav.${item.key}`) }}</span>
        </Transition>
      </button>

      <!-- Collapse toggle -->
      <button
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-all duration-200"
        @click="emit('toggleCollapse')"
      >
        <svg
          class="h-5 w-5 shrink-0 transition-transform duration-300"
          :class="collapsed ? 'rotate-180' : ''"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path :d="iconPaths['chevrons-left']" />
        </svg>
        <Transition name="fade">
          <span v-if="!collapsed">{{ collapsed ? '' : 'Réduire' }}</span>
        </Transition>
      </button>
    </div>
  </aside>
</template>
