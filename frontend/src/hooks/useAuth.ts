import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTarget = () => {
    const params = new URLSearchParams(location.search)
    return params.get('redirect') || '/'
  }

  async function login(email: string, password: string) {
    await store.login(email, password)
    navigate(redirectTarget(), { replace: true })
  }

  async function register(email: string, password: string, passwordConfirm: string, name: string) {
    await store.register(email, password, passwordConfirm, name)
    navigate(redirectTarget(), { replace: true })
  }

  async function loginWithProvider(provider: string) {
    await store.loginWithProvider(provider)
    navigate(redirectTarget(), { replace: true })
  }

  function logout() {
    store.logout()
    navigate('/login', { replace: true })
  }

  return {
    user: store.user,
    loading: store.loading,
    error: store.error,
    isAuthenticated: store.isAuthenticated,
    userRole: store.userRole,
    isAdmin: store.isAdmin,
    isCommercial: store.isCommercial,
    userInitials: store.userInitials,
    login,
    register,
    loginWithProvider,
    listAuthProviders: store.listAuthProviders,
    logout,
    clearError: store.clearError,
    hasRole: store.hasRole,
  }
}
