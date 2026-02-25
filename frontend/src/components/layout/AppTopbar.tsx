import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppBreadcrumb from './AppBreadcrumb'
import ThemeSwitcher from './ThemeSwitcher'
import LocaleSwitcher from './LocaleSwitcher'
import { Menu, Search, Settings, LogOut } from 'lucide-react'

interface Props {
  sidebarCollapsed: boolean
  onOpenMobileSidebar: () => void
}

export default function AppTopbar({ sidebarCollapsed, onOpenMobileSidebar }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, userInitials, userRole, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-surface-200 bg-surface-0/80 backdrop-blur-xl px-4 lg:px-6 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-[calc(68px+1.5rem)]' : 'lg:pl-[calc(15rem+1.5rem)]'
      }`}
    >
      {/* Mobile hamburger */}
      <button
        className="cursor-pointer lg:hidden flex items-center justify-center h-9 w-9 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
        onClick={onOpenMobileSidebar}
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      <AppBreadcrumb className="hidden sm:flex" />
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" strokeWidth={2} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          type="text"
          placeholder={t('common.search')}
          className="h-9 w-64 rounded-lg border border-surface-200 bg-surface-50 pl-10 pr-4 text-sm text-surface-700 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all dark:bg-surface-100 dark:border-surface-200 dark:text-surface-800"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 rounded border border-surface-200 bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-400">
          ⌘K
        </kbd>
      </div>

      <ThemeSwitcher />
      <LocaleSwitcher />

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          className="cursor-pointer flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-100 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
            {userInitials}
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-surface-200 bg-surface-50 shadow-modal overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-100">
              <p className="text-sm font-medium text-surface-900">{user?.name}</p>
              <p className="text-xs text-surface-500">{user?.email}</p>
              {userRole && (
                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-50 text-primary-700">
                  {t(`roles.${userRole}`)}
                </span>
              )}
            </div>
            <button
              className="cursor-pointer flex w-full items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-100 transition-colors"
              onClick={() => { setMenuOpen(false); navigate('/settings') }}
            >
              <Settings className="h-4 w-4" strokeWidth={2} />
              {t('nav.settings')}
            </button>
            <button
              className="cursor-pointer flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-500/10 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              {t('auth.logout')}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
