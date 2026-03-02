import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/authStore'

// Mock PocketBase
vi.mock('@/lib/pocketbase', () => ({
  default: {
    authStore: {
      isValid: false,
      record: null,
      onChange: vi.fn(),
      clear: vi.fn(),
    },
    collection: vi.fn(() => ({
      authWithPassword: vi.fn(),
      create: vi.fn(),
      authWithOAuth2: vi.fn(),
      update: vi.fn(),
      listAuthMethods: vi.fn().mockResolvedValue({ oauth2: { providers: [] } }),
    })),
    afterSend: null,
  },
}))

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      userRole: null,
      isAdmin: false,
      isCommercial: false,
      userInitials: '?',
    })
  })

  it('initial state is unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.userRole).toBeNull()
    expect(state.isAdmin).toBe(false)
    expect(state.isCommercial).toBe(false)
  })

  it('userInitials returns "?" for null user', () => {
    const state = useAuthStore.getState()
    expect(state.userInitials).toBe('?')
  })

  it('clearError resets error to null', () => {
    useAuthStore.setState({ error: 'Some error' })
    useAuthStore.getState().clearError()
    expect(useAuthStore.getState().error).toBeNull()
  })

  it('logout clears user state', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com', name: 'Test User', role: 'admin' } as never,
      isAuthenticated: true,
      userRole: 'admin',
      isAdmin: true,
    })
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isAdmin).toBe(false)
  })

  it('hasRole returns false when no user', () => {
    expect(useAuthStore.getState().hasRole('admin')).toBe(false)
  })

  it('hasRole returns true for matching role', () => {
    useAuthStore.setState({ userRole: 'admin' })
    expect(useAuthStore.getState().hasRole('admin')).toBe(true)
    expect(useAuthStore.getState().hasRole('commercial')).toBe(false)
  })

  it('hasRole accepts multiple roles', () => {
    useAuthStore.setState({ userRole: 'commercial' })
    expect(useAuthStore.getState().hasRole('admin', 'commercial')).toBe(true)
    expect(useAuthStore.getState().hasRole('admin', 'standard')).toBe(false)
  })
})
