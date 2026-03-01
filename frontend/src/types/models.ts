/** Base record fields from PocketBase */
export interface BaseModel {
  [key: string]: unknown
  id: string
  created: string
  updated: string
  collectionId: string
  collectionName: string
}

/** User roles */
export type UserRole = 'admin' | 'commercial' | 'standard'

/** Auth collection */
export interface User extends BaseModel {
  email: string
  verified: boolean
  name: string
  role: UserRole
  avatar: string
  phone: string
}

/** Company size categories */
export type CompanySize = 'tpe' | 'pme' | 'eti' | 'grande_entreprise'

export interface Company extends BaseModel {
  name: string
  industry: string
  website: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  size: CompanySize
  revenue: number
  owner: string
  notes: string
  logo: string
}

/** Contact tags */
export type ContactTag = 'prospect' | 'client' | 'partenaire' | 'fournisseur'

export interface Contact extends BaseModel {
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  company: string
  owner: string
  notes: string
  tags: ContactTag[]
}

/** Lead pipeline statuses */
export type LeadStatus =
  | 'nouveau'
  | 'contacte'
  | 'qualifie'
  | 'proposition'
  | 'negociation'
  | 'gagne'
  | 'perdu'

/** Priority levels */
export type Priority = 'basse' | 'moyenne' | 'haute' | 'urgente'

/** Lead sources */
export type LeadSource =
  | 'site_web'
  | 'email'
  | 'telephone'
  | 'salon'
  | 'recommandation'
  | 'autre'

export interface Lead extends BaseModel {
  title: string
  value: number
  status: LeadStatus
  priority: Priority
  source: LeadSource
  contact: string
  company: string
  owner: string
  expected_close: string
  closed_at: string
  notes: string
  campaign_id?: string
}

/** Task types */
export type TaskType = 'appel' | 'email' | 'reunion' | 'suivi' | 'autre'

/** Task statuses */
export type TaskStatus = 'a_faire' | 'en_cours' | 'terminee' | 'annulee'

export interface Task extends BaseModel {
  title: string
  description: string
  type: TaskType
  status: TaskStatus
  priority: Priority
  due_date: string
  reminder_at: string
  completed_at: string
  assignee: string
  created_by: string
  contact: string
  lead: string
  company: string
}

/** Invoice line item */
export interface InvoiceItem {
  description: string
  qty: number
  unit_price: number
}

/** Invoice statuses */
export type InvoiceStatus = 'brouillon' | 'emise' | 'payee' | 'en_retard' | 'annulee'

export interface Invoice extends BaseModel {
  number: string
  contact: string
  company: string
  lead: string
  owner: string
  amount: number
  tax_rate: number
  total: number
  status: InvoiceStatus
  issued_at: string
  due_at: string
  paid_at: string
  items: InvoiceItem[]
  notes: string
}

/** Email template types */
export type EmailTemplateType =
  | 'marketing'
  | 'transactionnel'
  | 'relance'
  | 'bienvenue'

export interface EmailTemplate extends BaseModel {
  name: string
  subject: string
  body: string
  type: EmailTemplateType
  active: boolean
  created_by: string
}

/** Email log statuses */
export type EmailLogStatus = 'envoye' | 'echoue' | 'en_attente' | 'ouvert' | 'clique'

export interface EmailLog extends BaseModel {
  template: string
  recipient_email: string
  recipient_contact: string
  subject: string
  status: EmailLogStatus
  sent_at: string
  opened_at: string
  clicked_at: string
  open_count: number
  click_count: number
  error_message: string
  sent_by: string
  campaign_id: string
  run_id: string
}

export interface CampaignRun {
  id: string
  run_number: number
  total: number
  sent: number
  failed: number
  sent_at: string
}

/** Campaign types */
export type CampaignType = 'email' | 'ads' | 'social' | 'event' | 'seo' | 'autre'

/** Campaign statuses */
export type CampaignStatus = 'brouillon' | 'en_cours' | 'envoye' | 'termine'

export interface Campaign extends BaseModel {
  name: string
  type: CampaignType
  template: string
  contact_ids: string[]
  status: CampaignStatus
  total: number
  sent: number
  failed: number
  campaign_key: string
  created_by: string
}

/** Activity types */
export type ActivityType =
  | 'creation'
  | 'modification'
  | 'email'
  | 'appel'
  | 'note'
  | 'statut_change'

export interface Activity extends BaseModel {
  type: ActivityType
  description: string
  user: string
  contact: string
  lead: string
  company: string
  metadata: Record<string, unknown>
}

/** Marketing expense categories — aligned with LeadSource */
export type MarketingExpenseCategory =
  | 'email'
  | 'site_web'
  | 'salon'
  | 'telephone'
  | 'recommandation'
  | 'autre'

export interface MarketingExpense extends BaseModel {
  date: string
  amount: number
  category: MarketingExpenseCategory
  description: string
  campaign_id?: string
  created_by: string
}
