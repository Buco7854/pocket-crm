import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

export function useAuth() {
  const store = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const { user, loading, error, isAuthenticated, userRole, isAdmin, isCommercial, userInitials } =
    storeToRefs(store)

  async function login(email: string, password: string) {
    await store.login(email, password)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  }

  async function register(email: string, password: string, passwordConfirm: string, name: string) {
    await store.register(email, password, passwordConfirm, name)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  }

  async function loginWithProvider(provider: string) {
    await store.loginWithProvider(provider)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  }

  function logout() {
    store.logout()
    router.push('/login')
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    userRole,
    isAdmin,
    isCommercial,
    userInitials,
    login,
    register,
    loginWithProvider,
    listAuthProviders: store.listAuthProviders,
    logout,
    clearError: store.clearError,
    hasRole: store.hasRole,
  }
}
