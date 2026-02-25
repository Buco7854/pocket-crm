import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    titleKey?: string
    requiresAuth?: boolean
    layout?: 'default' | 'auth'
    roles?: string[]
    breadcrumb?: { labelKey: string; to?: string }[]
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { titleKey: 'auth.login', layout: 'auth', requiresAuth: false },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { titleKey: 'auth.register', layout: 'auth', requiresAuth: false },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: {
      titleKey: 'nav.dashboard',
      requiresAuth: true,
      breadcrumb: [{ labelKey: 'nav.dashboard' }],
    },
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: () => import('@/views/ContactsView.vue'),
    meta: {
      titleKey: 'nav.contacts',
      requiresAuth: true,
      breadcrumb: [{ labelKey: 'nav.contacts' }],
    },
  },
  {
    path: '/companies',
    name: 'companies',
    component: () => import('@/views/CompaniesView.vue'),
    meta: {
      titleKey: 'nav.companies',
      requiresAuth: true,
      breadcrumb: [{ labelKey: 'nav.companies' }],
    },
  },
  {
    path: '/leads',
    name: 'leads',
    component: () => import('@/views/LeadsView.vue'),
    meta: {
      titleKey: 'nav.leads',
      requiresAuth: true,
      breadcrumb: [{ labelKey: 'nav.leads' }],
    },
  },
  {
    path: '/pipeline',
    name: 'pipeline',
    component: () => import('@/views/PipelineView.vue'),
    meta: {
      titleKey: 'nav.pipeline',
      requiresAuth: true,
      breadcrumb: [{ labelKey: 'nav.pipeline' }],
    },
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/views/TasksView.vue'),
    meta: {
      titleKey: 'nav.tasks',
      requiresAuth: true,
      breadcrumb: [{ labelKey: 'nav.tasks' }],
    },
  },
  {
    path: '/email',
    name: 'email',
    component: () => import('@/views/EmailView.vue'),
    meta: {
      titleKey: 'nav.email',
      requiresAuth: true,
      roles: ['admin', 'commercial'],
      breadcrumb: [{ labelKey: 'nav.email' }],
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: {
      titleKey: 'nav.settings',
      requiresAuth: true,
      breadcrumb: [{ labelKey: 'nav.settings' }],
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ── Navigation guard ──
router.beforeEach((to) => {
  const auth = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  // Redirect to login if not authenticated
  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Redirect to dashboard if already authenticated and visiting auth pages
  if (to.meta.layout === 'auth' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  // Role-based access control
  if (to.meta.roles?.length && auth.user) {
    const hasAccess = to.meta.roles.includes(auth.user.role)
    if (!hasAccess) {
      return { name: 'dashboard' }
    }
  }
})

export default router
