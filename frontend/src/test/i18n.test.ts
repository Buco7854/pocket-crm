import { describe, it, expect } from 'vitest'
import fr from '@/i18n/fr.json'
import en from '@/i18n/en.json'

// Recursively collect all keys from a nested object
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, fullKey)
    }
    return [fullKey]
  })
}

describe('i18n completeness', () => {
  const frKeys = new Set(collectKeys(fr as Record<string, unknown>))
  const enKeys = new Set(collectKeys(en as Record<string, unknown>))

  it('French has at least as many keys as English', () => {
    expect(frKeys.size).toBeGreaterThanOrEqual(enKeys.size)
  })

  it('all English keys exist in French', () => {
    const missing: string[] = []
    enKeys.forEach((key) => {
      if (!frKeys.has(key)) missing.push(key)
    })
    expect(missing).toEqual([])
  })

  it('all French keys exist in English', () => {
    const missing: string[] = []
    frKeys.forEach((key) => {
      if (!enKeys.has(key)) missing.push(key)
    })
    expect(missing).toEqual([])
  })

  it('neither translation is empty', () => {
    expect(frKeys.size).toBeGreaterThan(0)
    expect(enKeys.size).toBeGreaterThan(0)
  })

  it('both have required top-level namespaces', () => {
    const required = ['app', 'nav', 'common', 'auth', 'entities', 'fields', 'status']
    required.forEach((ns) => {
      expect(fr).toHaveProperty(ns)
      expect(en).toHaveProperty(ns)
    })
  })

  it('pipeline statuses are translated in both languages', () => {
    const statuses = ['nouveau', 'contacte', 'qualifie', 'proposition', 'negociation', 'gagne', 'perdu']
    statuses.forEach((s) => {
      expect(fr).toHaveProperty(`status.${s}`)
      expect(en).toHaveProperty(`status.${s}`)
    })
  })

  it('task statuses are translated in both languages', () => {
    const taskStatuses = ['a_faire', 'en_cours', 'terminee', 'annulee']
    taskStatuses.forEach((s) => {
      expect(fr).toHaveProperty(`taskStatus.${s}`)
      expect(en).toHaveProperty(`taskStatus.${s}`)
    })
  })

  it('invoice statuses are translated in both languages', () => {
    const invoiceStatuses = ['brouillon', 'emise', 'payee', 'en_retard', 'annulee']
    invoiceStatuses.forEach((s) => {
      expect(fr).toHaveProperty(`invoiceStatus.${s}`)
      expect(en).toHaveProperty(`invoiceStatus.${s}`)
    })
  })

  it('navigation links are translated', () => {
    const navKeys = ['dashboard', 'contacts', 'companies', 'leads', 'pipeline', 'tasks', 'invoices', 'settings']
    navKeys.forEach((k) => {
      expect(fr).toHaveProperty(`nav.${k}`)
      expect(en).toHaveProperty(`nav.${k}`)
    })
  })
})
