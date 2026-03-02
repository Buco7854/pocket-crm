import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Alert from '@/components/ui/Alert'
import Card from '@/components/ui/Card'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('is disabled when loading', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick handler', () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('renders with primary variant by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-primary-600')
  })

  it('renders with danger variant', () => {
    render(<Button variant="danger">Delete</Button>)
    expect(screen.getByRole('button').className).toContain('bg-danger-600')
  })

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Cancel</Button>)
    expect(screen.getByRole('button').className).toContain('bg-surface-0')
  })
})

describe('Badge', () => {
  it('renders content', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders with default variant', () => {
    render(<Badge variant="default">Default</Badge>)
    expect(screen.getByText('Default').className).toContain('bg-surface-100')
  })

  it('renders with success variant', () => {
    render(<Badge variant="success">Paid</Badge>)
    expect(screen.getByText('Paid').className).toContain('bg-success-50')
  })

  it('renders all pipeline statuses without error', () => {
    const statuses = ['nouveau', 'contacte', 'qualifie', 'proposition', 'negociation', 'gagne', 'perdu'] as const
    statuses.forEach((s) => {
      const { unmount } = render(<Badge variant={s}>{s}</Badge>)
      expect(screen.getByText(s)).toBeInTheDocument()
      unmount()
    })
  })

  it('renders dot when dot=true', () => {
    const { container } = render(<Badge dot>With dot</Badge>)
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots.length).toBeGreaterThan(0)
  })
})

describe('Alert', () => {
  it('renders message with success type', () => {
    render(<Alert type="success">Operation successful</Alert>)
    expect(screen.getByText('Operation successful')).toBeInTheDocument()
  })

  it('renders error type', () => {
    render(<Alert type="error">Something went wrong</Alert>)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders warning type', () => {
    render(<Alert type="warning">Be careful</Alert>)
    expect(screen.getByText('Be careful')).toBeInTheDocument()
  })

  it('renders info type by default', () => {
    render(<Alert>For your information</Alert>)
    expect(screen.getByText('For your information')).toBeInTheDocument()
  })

  it('is dismissible — clicking X hides the alert', () => {
    render(<Alert dismissible>Dismiss me</Alert>)
    expect(screen.getByText('Dismiss me')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument()
  })
})

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders header when provided', () => {
    render(<Card header={<span>Card Header</span>}>Content</Card>)
    expect(screen.getByText('Card Header')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders footer when provided', () => {
    render(<Card footer={<span>Card Footer</span>}>Content</Card>)
    expect(screen.getByText('Card Footer')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="my-custom-class">Content</Card>)
    expect(container.firstChild).toHaveClass('my-custom-class')
  })
})
