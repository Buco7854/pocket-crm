import type {
  User,
  Company,
  Contact,
  Lead,
  Task,
  EmailTemplate,
  EmailLog,
  Activity,
} from './models'

/** Map collection names to their typed models */
export interface CollectionMap {
  users: User
  companies: Company
  contacts: Contact
  leads: Lead
  tasks: Task
  email_templates: EmailTemplate
  email_logs: EmailLog
  activities: Activity
}

export type CollectionName = keyof CollectionMap

/** Typed expand for relation fields */
export type ExpandRecord<T extends Record<string, unknown>> = {
  [K in keyof T]?: T[K] extends string ? CollectionMap[keyof CollectionMap] : never
}

/** PocketBase list result with typed items */
export interface TypedListResult<T> {
  page: number
  perPage: number
  totalPages: number
  totalItems: number
  items: T[]
}

/** Query parameters for list requests */
export interface ListParams {
  page?: number
  perPage?: number
  sort?: string
  filter?: string
  expand?: string
  fields?: string
}

/** Common expand shapes used across the app */
export interface ContactExpand {
  company?: Company
  owner?: User
}

export interface LeadExpand {
  contact?: Contact
  company?: Company
  owner?: User
}

export interface TaskExpand {
  assignee?: User
  created_by?: User
  contact?: Contact
  lead?: Lead
  company?: Company
}

export interface ActivityExpand {
  user?: User
  contact?: Contact
  lead?: Lead
  company?: Company
}

export interface EmailLogExpand {
  template?: EmailTemplate
  recipient_contact?: Contact
  sent_by?: User
}
