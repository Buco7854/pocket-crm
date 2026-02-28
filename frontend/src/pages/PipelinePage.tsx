import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useLeads } from '@/hooks/useLeads'
import { useCollection } from '@/hooks/useCollection'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import { useAuthStore } from '@/store/authStore'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import PipelineBoard from '@/components/leads/PipelineBoard'
import LeadForm from '@/components/leads/LeadForm'
import LeadDetail from '@/components/leads/LeadDetail'
import type { Lead, LeadStatus, Contact, Company } from '@/types/models'
import type { SelectOption } from '@/components/ui/Select'

export default function PipelinePage() {
  const { t } = useTranslation()
  const { isAdmin, isCommercial, user } = useAuthStore()
  const { items, loading, error, fetchPipelineLeads, create, update, remove, updateLeadStatus, subscribeRealtime } = useLeads()
  const contactsCollection = useCollection<Contact>('contacts')
  const companiesCollection = useCollection<Company>('companies')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [presetStatus, setPresetStatus] = useState<LeadStatus | undefined>(undefined)

  const [contactOptions, setContactOptions] = useState<SelectOption[]>([])
  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([])

  const deleteConfirm = useDeleteConfirm()
  const canCreate = isAdmin || isCommercial

  useEffect(() => {
    contactsCollection.fetchList({ perPage: 200, sort: 'last_name', fields: 'id,first_name,last_name' }).then((r) => {
      if (r) setContactOptions(r.items.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` })))
    })
    companiesCollection.fetchList({ perPage: 200, sort: 'name', fields: 'id,name' }).then((r) => {
      if (r) setCompanyOptions(r.items.map((c) => ({ value: c.id, label: c.name })))
    })
  }, [])

  const load = useCallback(() => { fetchPipelineLeads() }, [fetchPipelineLeads])
  useEffect(() => { load() }, [load])

  // Realtime subscription: refresh pipeline on any lead change
  useEffect(() => {
    const unsub = subscribeRealtime(load)
    return unsub
  }, [subscribeRealtime, load])

  async function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    await updateLeadStatus(leadId, newStatus)
    load()
  }

  async function handleSubmit(data: Partial<Lead>) {
    setFormLoading(true)
    try {
      if (editing) await update(editing.id, data)
      else await create(data)
      setFormOpen(false); setEditing(null); setPresetStatus(undefined); load()
    } finally { setFormLoading(false) }
  }

  async function handleDetailStatusChange(status: LeadStatus) {
    if (!selected) return
    await updateLeadStatus(selected.id, status)
    setSelected(null); load()
  }

  function openAddToColumn(status: LeadStatus) { setPresetStatus(status); setEditing(null); setFormOpen(true) }
  function openCreate() { setPresetStatus(undefined); setEditing(null); setFormOpen(true) }
  function openEdit() { setEditing(selected); setSelected(null); setFormOpen(true) }
  function openDelete() { if (selected) { deleteConfirm.requestDelete(selected.id, selected.title); setSelected(null) } }

  async function handleDelete(id: string) { await remove(id); load() }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-surface-900">{t('nav.pipeline')}</h1>
        {canCreate && (
          <Button icon={<Plus className="h-4 w-4" strokeWidth={2} />} onClick={openCreate}>
            {t('common.addEntity', { entity: t('entities.lead') })}
          </Button>
        )}
      </div>

      {error && <Alert type="error" dismissible>{error}</Alert>}

      <PipelineBoard
        leads={items}
        loading={loading}
        onLeadClick={setSelected}
        onStatusChange={handleStatusChange}
        onAddLead={openAddToColumn}
      />

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); setPresetStatus(undefined) }}
        title={editing ? t('common.editEntity', { entity: t('entities.lead') }) : t('common.addEntity', { entity: t('entities.lead') })}
        size="lg"
      >
        <LeadForm
          lead={editing}
          contacts={contactOptions}
          companies={companyOptions}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditing(null); setPresetStatus(undefined) }}
          defaultStatus={presetStatus}
        />
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title} size="lg">
        {selected && (
          <LeadDetail
            lead={selected}
            onEdit={openEdit}
            onDelete={openDelete}
            onStatusChange={handleDetailStatusChange}
            canEdit={isAdmin || selected.owner === user?.id}
            canDelete={isAdmin}
          />
        )}
      </Modal>

      <ConfirmDialog open={deleteConfirm.isOpen} name={deleteConfirm.itemLabel} loading={deleteConfirm.loading} onConfirm={() => deleteConfirm.confirmDelete(handleDelete)} onCancel={deleteConfirm.cancelDelete} />
    </div>
  )
}
