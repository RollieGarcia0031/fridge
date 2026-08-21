import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import ThemeToggle from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders a toggle button', () => {
    render(<ThemeToggle />)

    expect(
      screen.getByRole('button', { name: /toggle dark mode/i }),
    ).toBeInTheDocument()
  })

  it('toggles the dark class and persists the preference', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button')

    fireEvent.click(button)
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('dark')

    fireEvent.click(button)
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
