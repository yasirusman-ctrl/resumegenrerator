import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary.tsx'

const Throw = () => { throw new Error('test error') }

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><div>safe</div></ErrorBoundary>)
    expect(screen.getByText('safe')).toBeDefined()
  })

  it('catches errors and shows fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Throw /></ErrorBoundary>)
    expect(screen.getByText('Something went wrong')).toBeDefined()
    expect(screen.getByText('test error')).toBeDefined()
  })
})
