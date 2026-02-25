import { create } from 'zustand'
import pb from '@/lib/pocketbase'
import type { User, UserRole } from '@/types/models'

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
  }
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null

  // Derived
  isAuthenticated: boolean
  userRole: UserRole | null
  isAdmin: boolean
  isCommercial: boolean
  userInitials: string

  // Actions
  init: () => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, passwordConfirm: string, name: string) => Promise<void>
  loginWithProvider: (provider: string) => Promise<void>
  listAuthProviders: () => Promise<{ name: string; displayName: string }[]>
  logout: () => void
  clearError: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

function deriveState(user: User | null) {
  const role = user?.role ?? null
  return {
    isAuthenticated: !!user && pb.authStore.isValid,
    userRole: role,
    isAdmin: role === 'admin',
    isCommercial: role === 'commercial',
    userInitials: getInitials(user?.name),
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  userRole: null,
  isAdmin: false,
  isCommercial: false,
  userInitials: '?',

  init() {
    if (pb.authStore.isValid && pb.authStore.record) {
      const user = pb.authStore.record as unknown as User
      set({ user, ...deriveState(user) })
    } else {
      set({ user: null, ...deriveState(null) })
    }

    pb.authStore.onChange((token) => {
      if (token && pb.authStore.record) {
        const user = pb.authStore.record as unknown as User
        set({ user, ...deriveState(user) })
      } else {
        set({ user: null, ...deriveState(null) })
      }
    })
  },

  async login(email, password) {
    set({ loading: true, error: null })
    try {
      const result = await pb.collection('users').authWithPassword(email, password)
      const user = result.record as unknown as User
      set({ user, ...deriveState(user) })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      set({ error: message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async register(email, password, passwordConfirm, name) {
    set({ loading: true, error: null })
    try {
      await pb.collection('users').create({ email, password, passwordConfirm, name, role: 'standard' })
      await get().login(email, password)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      set({ error: message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async loginWithProvider(provider) {
    set({ loading: true, error: null })
    try {
      const result = await pb.collection('users').authWithOAuth2({ provider })
      if (!result.record.role) {
        await pb.collection('users').update(result.record.id, { role: 'standard' })
        result.record.role = 'standard'
      }
      const user = result.record as unknown as User
      set({ user, ...deriveState(user) })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OAuth login failed'
      set({ error: message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  async listAuthProviders() {
    try {
      const result = await pb.collection('users').listAuthMethods()
      return result.oauth2?.providers ?? []
    } catch {
      return []
    }
  },

  logout() {
    pb.authStore.clear()
    set({ user: null, error: null, ...deriveState(null) })
  },

  clearError() {
    set({ error: null })
  },

  hasRole(...roles) {
    const { userRole } = get()
    return !!userRole && roles.includes(userRole)
  },
}))
