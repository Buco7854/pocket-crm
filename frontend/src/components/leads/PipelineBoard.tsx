import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, GripVertical } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { Lead, LeadStatus, Priority } from '@/types/models'
import type { BadgeVariant } from '@/components/ui/Badge'

const pipelineStatuses: LeadStatus[] = ['nouveau', 'contacte', 'qualifie', 'proposition', 'negociation']

const columnColors: Record<string, string> = {
  nouveau: 'bg-indigo-500',
  contacte: 'bg-violet-500',
  qualifie: 'bg-cyan-500',
  proposition: 'bg-amber-500',
  negociation: 'bg-orange-500',
}

const priorityVariant: Record<Priority, BadgeVariant> = {
  basse: 'default', moyenne: 'info', haute: 'warning', urgente: 'danger',
}

interface Props {
  leads: Lead[]
  loading: boolean
  onLeadClick: (lead: Lead) => void
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void
  onAddLead: (status: LeadStatus) => void
}

export default function PipelineBoard({ leads, loading, onLeadClick, onStatusChange, onAddLead }: Props) {
  const { t, i18n } = useTranslation()
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const groups: Record<string, Lead[]> = {}
    for (const s of pipelineStatuses) groups[s] = []
    for (const lead of leads) {
      if (groups[lead.status]) groups[lead.status].push(lead)
    }
    return groups
  }, [leads])

  const fmtCurrency = (val: number) => val ? new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, notation: 'compact' }).format(val) : '—'
  const fmtCurrencyFull = (val: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)

  if (loading && leads.length === 0) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStatuses.map((s) => (
          <div key={s} className="w-72 shrink-0 rounded-xl border border-surface-200 bg-surface-50">
            <div className={`h-1 rounded-t-xl ${columnColors[s]}`} />
            <div className="px-4 py-3 border-b border-surface-200">
              <div className="skeleton h-4 w-24" />
            </div>
            <div className="p-3 space-y-2.5">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full rounded-lg" />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipelineStatuses.map((status) => {
        const colLeads = grouped[status]
        const total = colLeads.reduce((sum, l) => sum + (l.value || 0), 0)

        return (
          <div
            key={status}
            className={`w-72 shrink-0 flex flex-col rounded-xl border bg-surface-50 transition-colors ${
              dragOverCol === status ? 'border-primary-400 bg-primary-50/30' : 'border-surface-200'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(status) }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOverCol(null)
              const leadId = e.dataTransfer.getData('text/plain')
              if (leadId) onStatusChange(leadId, status)
            }}
          >
            <div className={`h-1 rounded-t-xl ${columnColors[status]}`} />
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-surface-900">{t(`status.${status}`)}</span>
                <span className="text-xs bg-surface-200 text-surface-600 rounded-full px-2 py-0.5 font-medium">{colLeads.length}</span>
              </div>
              <button
                onClick={() => onAddLead(status)}
                className="cursor-pointer h-6 w-6 flex items-center justify-center rounded-md text-surface-400 hover:bg-surface-200 hover:text-surface-600 transition-colors"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-2 py-1.5 border-b border-surface-100 text-xs text-surface-500 text-center font-medium">
              {fmtCurrencyFull(total)}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[200px]">
              {colLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', lead.id); e.dataTransfer.effectAllowed = 'move' }}
                  onClick={() => onLeadClick(lead)}
                  className="rounded-lg border border-surface-200 bg-surface-0 p-3 shadow-card cursor-grab hover:shadow-card-hover transition-shadow active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-surface-900 leading-tight">{lead.title}</span>
                    <GripVertical className="h-4 w-4 text-surface-300 shrink-0" strokeWidth={2} />
                  </div>
                  <div className="text-sm font-semibold text-primary-600 mb-2">{fmtCurrency(lead.value)}</div>
                  <div className="flex flex-wrap gap-1.5 text-xs text-surface-500">
                    {(lead as any).expand?.company?.name && (
                      <span className="truncate max-w-[120px]">{(lead as any).expand.company.name}</span>
                    )}
                    {(lead as any).expand?.contact && (
                      <span className="truncate max-w-[120px]">
                        {(lead as any).expand.contact.first_name} {(lead as any).expand.contact.last_name}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <Badge variant={priorityVariant[lead.priority]} size="sm">{t(`priority.${lead.priority}`)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
