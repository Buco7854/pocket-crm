import { describe, it, expect } from 'vitest'

// Pipeline statuses and ordering
const PIPELINE_STATUSES = ['nouveau', 'contacte', 'qualifie', 'proposition', 'negociation', 'gagne', 'perdu'] as const
type PipelineStatus = typeof PIPELINE_STATUSES[number]

const STATUS_ORDER: Record<PipelineStatus, number> = {
  nouveau: 0,
  contacte: 1,
  qualifie: 2,
  proposition: 3,
  negociation: 4,
  gagne: 5,
  perdu: 6,
}

function isWon(status: PipelineStatus): boolean {
  return status === 'gagne'
}

function isLost(status: PipelineStatus): boolean {
  return status === 'perdu'
}

function isClosed(status: PipelineStatus): boolean {
  return isWon(status) || isLost(status)
}

function canAdvance(current: PipelineStatus, target: PipelineStatus): boolean {
  return STATUS_ORDER[target] > STATUS_ORDER[current]
}

describe('Pipeline statuses', () => {
  it('has exactly 7 statuses', () => {
    expect(PIPELINE_STATUSES.length).toBe(7)
  })

  it('starts with nouveau and ends with gagne/perdu', () => {
    expect(PIPELINE_STATUSES[0]).toBe('nouveau')
    expect(PIPELINE_STATUSES[PIPELINE_STATUSES.length - 2]).toBe('gagne')
    expect(PIPELINE_STATUSES[PIPELINE_STATUSES.length - 1]).toBe('perdu')
  })

  it('gagne is a won state', () => {
    expect(isWon('gagne')).toBe(true)
    expect(isWon('nouveau')).toBe(false)
  })

  it('perdu is a lost state', () => {
    expect(isLost('perdu')).toBe(true)
    expect(isLost('gagne')).toBe(false)
  })

  it('both gagne and perdu are closed', () => {
    expect(isClosed('gagne')).toBe(true)
    expect(isClosed('perdu')).toBe(true)
    expect(isClosed('nouveau')).toBe(false)
    expect(isClosed('negociation')).toBe(false)
  })

  it('can advance from nouveau to proposition', () => {
    expect(canAdvance('nouveau', 'proposition')).toBe(true)
  })

  it('cannot go backwards in pipeline', () => {
    expect(canAdvance('proposition', 'nouveau')).toBe(false)
    expect(canAdvance('negociation', 'qualifie')).toBe(false)
  })

  it('each status has a unique order', () => {
    const orders = Object.values(STATUS_ORDER)
    const unique = new Set(orders)
    expect(unique.size).toBe(PIPELINE_STATUSES.length)
  })
})

describe('Lead value calculations', () => {
  interface Lead {
    value: number
    status: PipelineStatus
  }

  function totalPipelineValue(leads: Lead[]): number {
    return leads
      .filter((l) => !isClosed(l.status))
      .reduce((sum, l) => sum + l.value, 0)
  }

  function totalWonValue(leads: Lead[]): number {
    return leads
      .filter((l) => l.status === 'gagne')
      .reduce((sum, l) => sum + l.value, 0)
  }

  function conversionRate(leads: Lead[]): number {
    if (leads.length === 0) return 0
    return (leads.filter((l) => l.status === 'gagne').length / leads.length) * 100
  }

  const testLeads: Lead[] = [
    { value: 5000, status: 'nouveau' },
    { value: 10000, status: 'gagne' },
    { value: 3000, status: 'perdu' },
    { value: 7500, status: 'proposition' },
    { value: 2000, status: 'gagne' },
  ]

  it('calculates active pipeline value (excluding closed)', () => {
    expect(totalPipelineValue(testLeads)).toBe(12500) // 5000 + 7500
  })

  it('calculates total won value', () => {
    expect(totalWonValue(testLeads)).toBe(12000) // 10000 + 2000
  })

  it('calculates conversion rate correctly', () => {
    expect(conversionRate(testLeads)).toBe(40) // 2 won out of 5
  })

  it('returns 0 conversion rate for empty leads', () => {
    expect(conversionRate([])).toBe(0)
  })
})
