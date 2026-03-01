import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutGrid, Users, Building2, TrendingUp, Columns3,
  FileText, BarChart3,
  CheckSquare, Mail, Settings, ChevronsLeft,
} from 'lucide-react'

interface Props {
  collapsed: boolean
  onToggleCollapse: () => void
}

interface NavItem {
  key: string
  icon: React.ElementType
  path: string
  roles?: string[]
}

const allMainNav: NavItem[] = [
  { key: 'dashboard', icon: LayoutGrid, path: '/' },
  { key: 'contacts', icon: Users, path: '/contacts' },
  { key: 'companies', icon: Building2, path: '/companies' },
  { key: 'leads', icon: TrendingUp, path: '/leads' },
  { key: 'pipeline', icon: Columns3, path: '/pipeline' },
  { key: 'tasks', icon: CheckSquare, path: '/tasks' },
  { key: 'invoices', icon: FileText, path: '/invoices', roles: ['admin', 'commercial'] },
  { key: 'email', icon: Mail, path: '/email', roles: ['admin', 'commercial'] },
  { key: 'stats', icon: BarChart3, path: '/stats', roles: ['admin', 'commercial'] },
]

const bottomNav: NavItem[] = [
  { key: 'settings', icon: Settings, path: '/settings' },
]

export default function AppSidebar({ collapsed, onToggleCollapse }: Props) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const mainNav = allMainNav.filter((item) => {
    if (!item.roles) return true
    return user ? item.roles.includes(user.role) : false
  })

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  function navItemClass(path: string) {
    const base = 'cursor-pointer group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200'
    return isActive(path)
      ? `${base} bg-sidebar-active text-sidebar-text-active shadow-lg shadow-primary-600/20`
      : `${base} text-sidebar-text hover:bg-sidebar-hover hover:text-surface-900 dark:hover:text-white`
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-[var(--ease-spring)] ${collapsed ? 'w-[68px]' : 'w-60'}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
          P
        </div>
        {!collapsed && (
          <span className="text-base font-semibold text-sidebar-text tracking-tight truncate">
            {t('app.name')}
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {mainNav.map((item) => (
          <button key={item.key} className={navItemClass(item.path)} onClick={() => navigate(item.path)}>
            <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border py-4 px-3 space-y-1">
        {bottomNav.map((item) => (
          <button key={item.key} className={navItemClass(item.path)} onClick={() => navigate(item.path)}>
            <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
          </button>
        ))}

        <button
          className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-surface-900 dark:hover:text-white transition-all duration-200"
          onClick={onToggleCollapse}
        >
          <ChevronsLeft
            className={`h-5 w-5 shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            strokeWidth={1.75}
          />
          {!collapsed && <span>{t('common.collapse')}</span>}
        </button>
      </div>
    </aside>
  )
}
