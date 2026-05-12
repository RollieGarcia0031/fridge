import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, Mock } from 'vitest'
import AppHeader from './AppHeader'
import { usePathname } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('AppHeader', () => {
  it('renders the logo and title', () => {
    ;(usePathname as Mock).mockReturnValue('/')

    render(<AppHeader />)

    expect(screen.getByText('Fridge')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('renders the Logout link when not on auth pages', () => {
    ;(usePathname as Mock).mockReturnValue('/')

    render(<AppHeader />)

    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('does not render the header on login page', () => {
    ;(usePathname as Mock).mockReturnValue('/auth/login')

    const { container } = render(<AppHeader />)

    expect(container.firstChild).toBeNull()
  })

  it('does not render the header on signup page', () => {
    ;(usePathname as Mock).mockReturnValue('/auth/signup')

    const { container } = render(<AppHeader />)

    expect(container.firstChild).toBeNull()
  })
})
