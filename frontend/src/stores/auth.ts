import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import pb from '@/lib/pocketbase'
import type { User, UserRole } from '@/types/models'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ──
  const isAuthenticated = computed(() => pb.authStore.isValid && !!user.value)
  const userRole = computed<UserRole | null>(() => user.value?.role ?? null)
  const isAdmin = computed(() => userRole.value === 'admin')
  const isCommercial = computed(() => userRole.value === 'commercial')
  const userInitials = computed(() => {
    if (!user.value?.name) return '?'
    const parts = user.value.name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  })

  // ── Actions ──

  /** Hydrate user from PocketBase's persisted auth store on app load */
  function init() {
    if (pb.authStore.isValid && pb.authStore.record) {
      user.value = pb.authStore.record as unknown as User
    } else {
      user.value = null
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const result = await pb.collection('users').authWithPassword(email, password)
      user.value = result.record as unknown as User
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, passwordConfirm: string, name: string) {
    loading.value = true
    error.value = null
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        name,
        role: 'standard',
      })
      // Auto-login after successful registration
      await login(email, password)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loginWithProvider(provider: string) {
    loading.value = true
    error.value = null
    try {
      const result = await pb.collection('users').authWithOAuth2({ provider })
      // Set default role for new OAuth users
      if (!result.record.role) {
        await pb.collection('users').update(result.record.id, { role: 'standard' })
        result.record.role = 'standard'
      }
      user.value = result.record as unknown as User
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OAuth login failed'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Fetch the list of enabled OAuth2 providers from PocketBase */
  async function listAuthProviders() {
    try {
      const result = await pb.collection('users').listAuthMethods()
      return result.oauth2?.providers ?? []
    } catch {
      return []
    }
  }

  function logout() {
    pb.authStore.clear()
    user.value = null
    error.value = null
  }

  function clearError() {
    error.value = null
  }

  /** Check if user has one of the given roles */
  function hasRole(...roles: UserRole[]): boolean {
    return !!userRole.value && roles.includes(userRole.value)
  }

  return {
    // state
    user,
    loading,
    error,
    // computed
    isAuthenticated,
    userRole,
    isAdmin,
    isCommercial,
    userInitials,
    // actions
    init,
    login,
    register,
    loginWithProvider,
    listAuthProviders,
    logout,
    clearError,
    hasRole,
  }
})
