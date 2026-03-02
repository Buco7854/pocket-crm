import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search, User, Building2, TrendingUp, ArrowRight } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import pb from '@/lib/pocketbase'
import type { Contact, Company, Lead } from '@/types/models'

interface Results {
  contacts: Contact[]
  companies: Company[]
  leads: Lead[]
}

export default function GlobalSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        if (results) setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [results])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    const q = debouncedQuery.replace(/"/g, '\\"')
    Promise.all([
      pb.collection('contacts').getList(1, 3, {
        filter: `first_name ~ "${q}" || last_name ~ "${q}" || email ~ "${q}"`,
        fields: 'id,first_name,last_name,email',
      }),
      pb.collection('companies').getList(1, 3, {
        filter: `name ~ "${q}" || email ~ "${q}" || city ~ "${q}"`,
        fields: 'id,name,city,industry',
      }),
      pb.collection('leads').getList(1, 3, {
        filter: `title ~ "${q}"`,
        fields: 'id,title,status,value',
      }),
    ])
      .then(([contacts, companies, leads]) => {
        setResults({
          contacts: contacts.items as unknown as Contact[],
          companies: companies.items as unknown as Company[],
          leads: leads.items as unknown as Lead[],
        })
        setOpen(true)
      })
      .catch(() => {
        setResults({ contacts: [], companies: [], leads: [] })
        setOpen(true)
      })
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  function goToPage(path: string) {
    setOpen(false)
    setQuery('')
    setResults(null)
    navigate(`${path}?q=${encodeURIComponent(query)}`)
  }

  const hasResults =
    results && (results.contacts.length > 0 || results.companies.length > 0 || results.leads.length > 0)

  return (
    <div className="relative hidden md:block" ref={containerRef}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none"
        strokeWidth={2}
      />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results) setOpen(true)
        }}
        type="text"
        placeholder={t('common.search')}
        className="h-9 w-64 rounded-lg border border-surface-200 bg-surface-50 pl-10 pr-10 text-sm text-surface-700 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all dark:bg-surface-100 dark:border-surface-200 dark:text-surface-800"
      />
      {!query && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 rounded border border-surface-200 bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-400">
          ⌘K
        </kbd>
      )}

      {open && query.trim() && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-surface-200 bg-surface-50 shadow-modal overflow-hidden z-50">
          {loading && (
            <div className="px-4 py-3 text-sm text-surface-500">{t('common.loading')}</div>
          )}

          {!loading && !hasResults && (
            <div className="px-4 py-3 text-sm text-surface-500">
              {t('search.noResultsFor', { query: debouncedQuery })}
            </div>
          )}

          {!loading && hasResults && (
            <div className="py-1">
              {/* Contacts */}
              {results!.contacts.length > 0 && (
                <section>
                  <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                    <User className="h-3 w-3 text-surface-400" strokeWidth={2} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                      {t('entities.contacts')}
                    </span>
                  </div>
                  {results!.contacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => goToPage('/contacts')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-200 transition-colors"
                    >
                      <div className="h-7 w-7 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-surface-900 truncate">
                          {c.first_name} {c.last_name}
                        </div>
                        {c.email && (
                          <div className="text-xs text-surface-500 truncate">{c.email}</div>
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage('/contacts')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-surface-200 transition-colors"
                  >
                    <span>{t('search.seeAll', { entity: t('entities.contacts') })}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </section>
              )}

              {/* Companies */}
              {results!.companies.length > 0 && (
                <section className={results!.contacts.length > 0 ? 'border-t border-surface-200' : ''}>
                  <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                    <Building2 className="h-3 w-3 text-surface-400" strokeWidth={2} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                      {t('entities.companies')}
                    </span>
                  </div>
                  {results!.companies.map((co) => (
                    <button
                      key={co.id}
                      onClick={() => goToPage('/companies')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-200 transition-colors"
                    >
                      <div className="h-7 w-7 rounded-lg bg-surface-200 dark:bg-surface-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-surface-500" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-surface-900 truncate">{co.name}</div>
                        {co.city && (
                          <div className="text-xs text-surface-500 truncate">{co.city}</div>
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage('/companies')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-surface-200 transition-colors"
                  >
                    <span>{t('search.seeAll', { entity: t('entities.companies') })}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </section>
              )}

              {/* Leads */}
              {results!.leads.length > 0 && (
                <section
                  className={
                    results!.contacts.length > 0 || results!.companies.length > 0
                      ? 'border-t border-surface-200'
                      : ''
                  }
                >
                  <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                    <TrendingUp className="h-3 w-3 text-surface-400" strokeWidth={2} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                      {t('entities.leads')}
                    </span>
                  </div>
                  {results!.leads.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => goToPage('/leads')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-200 transition-colors"
                    >
                      <div className="h-7 w-7 rounded-lg bg-success-100 dark:bg-success-950/50 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-3.5 w-3.5 text-success-600 dark:text-success-400" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-surface-900 truncate">{l.title}</div>
                        {l.value != null && (
                          <div className="text-xs text-surface-500 truncate">
                            {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(l.value)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage('/leads')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-surface-200 transition-colors"
                  >
                    <span>{t('search.seeAll', { entity: t('entities.leads') })}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
