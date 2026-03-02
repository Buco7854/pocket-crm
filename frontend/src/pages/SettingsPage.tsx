import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Palette, Users, Save, Sun, Moon, Monitor, Languages } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'
import pb from '@/lib/pocketbase'
import type { User as UserModel, UserRole } from '@/types/models'
import type { SupportedLocale } from '@/i18n'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type Tab = 'profile' | 'preferences' | 'users'

const THEME_OPTIONS: { value: ThemeMode; icon: React.ElementType; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'system', icon: Monitor, labelKey: 'theme.system' },
]

const LOCALE_OPTIONS: { value: SupportedLocale; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

const ROLES: UserRole[] = ['admin', 'commercial', 'standard']

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user, isAdmin } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('profile')

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', phone: user.phone || '' })
  }, [user])

  async function saveProfile() {
    if (!user) return
    setProfileLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        name: profileForm.name,
        phone: profileForm.phone,
      })
      toast.success(t('settings.profile.saved'))
    } catch {
      toast.error(t('settings.profile.saveError'))
    } finally {
      setProfileLoading(false)
    }
  }

  // ── Locale change ─────────────────────────────────────────────────────────
  function changeLocale(locale: SupportedLocale) {
    i18n.changeLanguage(locale)
    localStorage.setItem('pocket-crm-locale', locale)
  }

  // ── Users management (admin only) ─────────────────────────────────────────
  const [allUsers, setAllUsers] = useState<UserModel[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    if (tab === 'users' && isAdmin) {
      loadUsers()
    }
  }, [tab, isAdmin])

  async function loadUsers() {
    setUsersLoading(true)
    try {
      const result = await pb.collection('users').getList<UserModel>(1, 200, { sort: 'name' })
      setAllUsers(result.items)
    } finally {
      setUsersLoading(false)
    }
  }

  async function changeRole(userId: string, role: UserRole) {
    if (userId === user?.id) {
      toast.warning(t('settings.users.cannotChangeSelf'))
      return
    }
    try {
      await pb.collection('users').update(userId, { role })
      setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      toast.success(t('settings.users.roleChanged'))
    } catch {
      toast.error(t('settings.users.roleChangeError'))
    }
  }

  // ── Tabs config ───────────────────────────────────────────────────────────
  const tabs: { key: Tab; icon: React.ElementType; labelKey: string }[] = [
    { key: 'profile', icon: User, labelKey: 'settings.tabs.profile' },
    { key: 'preferences', icon: Palette, labelKey: 'settings.tabs.preferences' },
    ...(isAdmin ? [{ key: 'users' as Tab, icon: Users, labelKey: 'settings.tabs.users' }] : []),
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-900">{t('settings.title')}</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-surface-200">
        {tabs.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
            onClick={() => setTab(key)}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && (
        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-surface-900">{t('settings.profile.title')}</h2>
              <p className="text-sm text-surface-500 mt-0.5">{t('settings.profile.description')}</p>
            </div>

            {/* Avatar + info */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold select-none">
                {user?.name
                  ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                  : '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">{user?.name}</p>
                <p className="text-xs text-surface-500">{user?.email}</p>
                {user?.role && (
                  <span className="mt-1 inline-flex">
                    <Badge variant="primary" size="sm">{t(`roles.${user.role}`)}</Badge>
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  {t('settings.profile.name')}
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-surface-200 bg-surface-0 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  {t('settings.profile.phone')}
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-surface-200 bg-surface-0 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  {t('settings.profile.email')}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full h-9 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm text-surface-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-surface-400">{t('settings.profile.emailHint')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  {t('settings.profile.role')}
                </label>
                <input
                  type="text"
                  value={user?.role ? t(`roles.${user.role}`) : ''}
                  disabled
                  className="w-full h-9 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm text-surface-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={saveProfile} loading={profileLoading} icon={<Save className="h-4 w-4" />}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Preferences tab ── */}
      {tab === 'preferences' && (
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900">{t('settings.preferences.title')}</h2>
              <p className="text-sm text-surface-500 mt-0.5">{t('settings.preferences.description')}</p>
            </div>

            {/* Theme */}
            <div>
              <p className="text-sm font-medium text-surface-700 mb-3">{t('settings.preferences.theme')}</p>
              <div className="flex flex-wrap gap-2">
                {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
                  <button
                    key={value}
                    className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      theme === value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-surface-200 bg-surface-0 text-surface-600 hover:border-primary-300 hover:bg-surface-50'
                    }`}
                    onClick={() => setTheme(value)}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <p className="text-sm font-medium text-surface-700 mb-1">{t('settings.preferences.language')}</p>
              <p className="text-xs text-surface-400 mb-3">{t('settings.preferences.languageHint')}</p>
              <div className="flex flex-wrap gap-2">
                {LOCALE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      i18n.language === value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-surface-200 bg-surface-0 text-surface-600 hover:border-primary-300 hover:bg-surface-50'
                    }`}
                    onClick={() => changeLocale(value)}
                  >
                    <Languages className="h-4 w-4" strokeWidth={2} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Users tab (admin only) ── */}
      {tab === 'users' && isAdmin && (
        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-surface-900">{t('settings.users.title')}</h2>
              <p className="text-sm text-surface-500 mt-0.5">{t('settings.users.description')}</p>
            </div>

            {usersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-surface-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : allUsers.length === 0 ? (
              <p className="text-sm text-surface-500">{t('settings.users.noUsers')}</p>
            ) : (
              <div className="divide-y divide-surface-100">
                {allUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 py-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold select-none">
                      {u.name
                        ? u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                        : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">
                        {u.name}
                        {u.id === user?.id && (
                          <span className="ml-2 text-xs text-surface-400">(vous)</span>
                        )}
                      </p>
                      <p className="text-xs text-surface-500 truncate">{u.email}</p>
                    </div>
                    <select
                      value={u.role}
                      disabled={u.id === user?.id}
                      onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                      className="h-8 px-2 rounded-lg border border-surface-200 bg-surface-0 text-xs text-surface-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{t(`roles.${r}`)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
