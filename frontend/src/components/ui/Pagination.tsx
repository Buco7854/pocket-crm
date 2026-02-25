import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  totalItems: number
  perPage?: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, totalItems, perPage = 20, onPageChange }: Props) {
  const { t } = useTranslation()
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, totalItems)

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <p className="text-surface-500 hidden sm:block">
        {t('common.showing')} <span className="font-medium text-surface-700">{from}</span>{' '}
        {t('common.to')} <span className="font-medium text-surface-700">{to}</span>{' '}
        {t('common.of')} <span className="font-medium text-surface-700">{totalItems}</span>{' '}
        {t('common.items')}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          className="cursor-pointer flex items-center justify-center h-8 w-8 rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={i} className="flex items-center justify-center h-8 w-8 text-surface-400">&hellip;</span>
          ) : (
            <button
              key={i}
              className={`cursor-pointer flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button
          disabled={page >= totalPages}
          className="cursor-pointer flex items-center justify-center h-8 w-8 rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
