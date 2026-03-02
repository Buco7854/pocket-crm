import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search, X, User, Building2, TrendingUp, CheckSquare, Plus, ArrowRight,
  Loader2
} from 'lucide-react'
import pb from '@/lib/pocketbase'
import type { Contact, Company, Lead, Task } from '@/types/models'

// ── Types ─────────────────────────────────────────────────────────────────────

type EntityType = 'contact' | 'company' | 'lead' | 'task'

interface SearchResult {
  id: string
  type: EntityType
  primary: string
  secondary?: string
  href: string
}

interface Section {
  type: EntityType
  icon: React.ElementType
  labelKey: string
  pluralKey: string
  results: SearchResult[]
  createHref: string
  createLabelKey: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toResults(type: EntityType, href: string, items: (Contact | Company | Lead | Task)[]): SearchResult[] {
  return items.map((item) => {
    if (type === 'contact') {
      const c = item as Contact
      return { id: c.id, type, primary: `${c.first_name} ${c.last_name}`.trim(), secondary: c.email || c.position, href: `${href}?open=${c.id}` }
    }
    if (type === 'company') {
      const c = item as Company
      return { id: c.id, type, primary: c.name, secondary: c.industry || c.city, href: `${href}?open=${c.id}` }
    }
    if (type === 'lead') {
      const l = item as Lead
      return { id: l.id, type, primary: l.title, secondary: l.value ? `${l.value.toLocaleString()} €` : undefined, href: `${href}?open=${l.id}` }
    }
    const t = item as Task
    return { id: t.id, type, primary: t.title, secondary: t.status, href: `${href}?open=${t.id}` }
  })
}

const ENTITY_ICONS: Record<EntityType, React.ElementType> = {
  contact: User,
  company: Building2,
  lead: TrendingUp,
  task: CheckSquare,
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
}

const MAX_PER_SECTION = 4

export default function GlobalSearch({ open, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Flat list of all navigable items (results + create shortcuts)
  const allItems = sections.flatMap((s) => [
    ...s.results.map((r) => ({ href: r.href })),
  ])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSections([])
      setActiveIndex(-1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSections([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const filter = (field: string) => `${field} ~ "${q.replace(/"/g, '')}"`

      const [contacts, companies, leads, tasks] = await Promise.allSettled([
        pb.collection('contacts').getList<Contact>(1, MAX_PER_SECTION, {
          filter: `${filter('first_name')} || ${filter('last_name')} || ${filter('email')} || ${filter('position')}`,
          sort: 'first_name',
        }),
        pb.collection('companies').getList<Company>(1, MAX_PER_SECTION, {
          filter: `${filter('name')} || ${filter('industry')} || ${filter('city')}`,
          sort: 'name',
        }),
        pb.collection('leads').getList<Lead>(1, MAX_PER_SECTION, {
          filter: filter('title'),
          sort: '-created',
        }),
        pb.collection('tasks').getList<Task>(1, MAX_PER_SECTION, {
          filter: `${filter('title')} || ${filter('description')}`,
          sort: '-created',
        }),
      ])

      const built: Section[] = [
        {
          type: 'contact',
          icon: User,
          labelKey: 'entities.contact',
          pluralKey: 'entities.contacts',
          results: contacts.status === 'fulfilled' ? toResults('contact', '/contacts', contacts.value.items) : [],
          createHref: '/contacts',
          createLabelKey: 'search.createContact',
        },
        {
          type: 'company',
          icon: Building2,
          labelKey: 'entities.company',
          pluralKey: 'entities.companies',
          results: companies.status === 'fulfilled' ? toResults('company', '/companies', companies.value.items) : [],
          createHref: '/companies',
          createLabelKey: 'search.createCompany',
        },
        {
          type: 'lead',
          icon: TrendingUp,
          labelKey: 'entities.lead',
          pluralKey: 'entities.leads',
          results: leads.status === 'fulfilled' ? toResults('lead', '/leads', leads.value.items) : [],
          createHref: '/leads',
          createLabelKey: 'search.createLead',
        },
        {
          type: 'task',
          icon: CheckSquare,
          labelKey: 'entities.task',
          pluralKey: 'entities.tasks',
          results: tasks.status === 'fulfilled' ? toResults('task', '/tasks', tasks.value.items) : [],
          createHref: '/tasks',
          createLabelKey: 'search.createTask',
        },
      ].filter((s) => s.results.length > 0) as Section[]

      setSections(built)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setSections([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => doSearch(query), 280)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, doSearch])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, allItems.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
      }
      if (e.key === 'Enter' && activeIndex >= 0 && allItems[activeIndex]) {
        e.preventDefault()
        navigate(allItems[activeIndex].href)
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, allItems, activeIndex, navigate, onClose])

  // Reset active index when results change
  useEffect(() => { setActiveIndex(-1) }, [sections])

  function go(href: string) {
    navigate(href)
    onClose()
  }

  function goWithQuery(href: string) {
    navigate(query.trim() ? `${href}?q=${encodeURIComponent(query)}` : href)
    onClose()
  }

  if (!open) return null

  const hasResults = sections.length > 0
  const showEmpty = !loading && query.trim() && !hasResults

  // Accumulate result index across sections for keyboard highlight
  let resultOffset = 0

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 top-[10vh] z-[201] mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border border-surface-200 bg-surface-0 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden">

          {/* Search input row */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100">
            {loading
              ? <Loader2 className="h-5 w-5 text-primary-500 animate-spin shrink-0" strokeWidth={2} />
              : <Search className="h-5 w-5 text-surface-400 shrink-0" strokeWidth={2} />
            }
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="flex-1 bg-transparent text-base text-surface-900 placeholder:text-surface-400 focus:outline-none"
            />
            {query && (
              <button
                className="cursor-pointer flex items-center justify-center h-6 w-6 rounded-md text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-surface-200 bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-400">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {hasResults && (
            <div className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {sections.map((section) => {
                const Icon = section.icon
                const sectionStart = resultOffset
                resultOffset += section.results.length

                return (
                  <div key={section.type} className="py-2">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-4 pb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                        {t(section.pluralKey)}
                      </span>
                      <button
                        className="cursor-pointer flex items-center gap-1 text-[11px] text-primary-500 hover:text-primary-600 font-medium transition-colors"
                        onClick={() => go(section.createHref)}
                      >
                        <Plus className="h-3 w-3" strokeWidth={2.5} />
                        {t(section.createLabelKey)}
                      </button>
                    </div>

                    {/* Results */}
                    {section.results.map((result, i) => {
                      const globalIdx = sectionStart + i
                      const isActive = globalIdx === activeIndex
                      return (
                        <button
                          key={result.id}
                          className={`cursor-pointer flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isActive ? 'bg-primary-500/10' : 'hover:bg-surface-100'
                          }`}
                          onClick={() => go(result.href)}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                        >
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isActive ? 'bg-primary-500/15' : 'bg-surface-100'
                          }`}>
                            <Icon className={`h-4 w-4 ${isActive ? 'text-primary-500' : 'text-surface-500'}`} strokeWidth={2} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className={`block text-sm font-medium truncate ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-900'}`}>
                              {result.primary}
                            </span>
                            {result.secondary && (
                              <span className={`block text-xs truncate ${isActive ? 'text-primary-500 dark:text-primary-400' : 'text-surface-500'}`}>
                                {result.secondary}
                              </span>
                            )}
                          </span>
                          <ArrowRight className={`h-4 w-4 shrink-0 transition-opacity ${isActive ? 'opacity-100 text-primary-500 dark:text-primary-400' : 'opacity-0'}`} strokeWidth={2} />
                        </button>
                      )
                    })}

                    {/* "See more" link */}
                    <button
                      className="cursor-pointer flex w-full items-center gap-1.5 px-4 py-1.5 text-xs text-surface-400 hover:text-primary-500 transition-colors"
                      onClick={() => goWithQuery(section.createHref)}
                    >
                      <ArrowRight className="h-3 w-3" strokeWidth={2} />
                      {t('search.seeAll', { entity: t(section.pluralKey).toLowerCase() })}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="px-4 py-10 text-center">
              <Search className="mx-auto h-8 w-8 text-surface-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-surface-500">{t('search.noResults', { query })}</p>
            </div>
          )}

          {/* Default hint (no query) */}
          {!query && !loading && (
            <div className="px-4 py-4">
              <p className="text-xs text-surface-400 mb-3">{t('search.quickAccess')}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { type: 'contact' as EntityType, href: '/contacts', labelKey: 'entities.contacts' },
                  { type: 'company' as EntityType, href: '/companies', labelKey: 'entities.companies' },
                  { type: 'lead' as EntityType, href: '/leads', labelKey: 'entities.leads' },
                  { type: 'task' as EntityType, href: '/tasks', labelKey: 'entities.tasks' },
                ].map(({ type, href, labelKey }) => {
                  const Icon = ENTITY_ICONS[type]
                  return (
                    <button
                      key={type}
                      className="cursor-pointer flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-600 hover:border-primary-500/30 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                      onClick={() => go(href)}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span className="truncate">{t(labelKey)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 border-t border-surface-100 px-4 py-2">
            <span className="flex items-center gap-1 text-[10px] text-surface-400">
              <kbd className="inline-flex items-center rounded border border-surface-200 bg-surface-100 px-1 py-0.5 font-medium">↑↓</kbd>
              {t('search.navigate')}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-surface-400">
              <kbd className="inline-flex items-center rounded border border-surface-200 bg-surface-100 px-1 py-0.5 font-medium">↵</kbd>
              {t('search.open')}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-surface-400">
              <kbd className="inline-flex items-center rounded border border-surface-200 bg-surface-100 px-1 py-0.5 font-medium">ESC</kbd>
              {t('search.close')}
            </span>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
