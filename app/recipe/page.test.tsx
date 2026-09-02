import { render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Recipe from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: ComponentProps<'div'>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

const getSession = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    auth: { getSession: (...args: unknown[]) => getSession(...args) },
  }),
}))

const getSavedRecipes = vi.fn()
const saveRecipe = vi.fn()
const unlistRecipes = vi.fn()
vi.mock('@/lib/services/Recipes', () => ({
  getSavedRecipes: (...args: unknown[]) => getSavedRecipes(...args),
  saveRecipe: (...args: unknown[]) => saveRecipe(...args),
  unlistRecipes: (...args: unknown[]) => unlistRecipes(...args),
}))

const fetchMock = vi.fn()

function seedRecipe() {
  sessionStorage.setItem(
    'recipe',
    JSON.stringify({
      description: '',
      recipe_name: 'Garlic Butter Chicken',
      ingredients: ['chicken', 'butter', 'garlic'],
    }),
  )
}

function mockInstructions(overrides: Record<string, unknown> = {}) {
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      name: 'Garlic Butter Chicken',
      servings: 2,
      cook_time_minutes: 25,
      ingredients: [{ name: 'chicken', quantity: '500g' }],
      steps: [
        { order: 1, title: 'Sear', instruction: 'Sear the chicken.' },
      ],
      tips: [],
      ...overrides,
    }),
  })
}

describe('Recipe page tutorial section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.stubGlobal('fetch', fetchMock)
    seedRecipe()
    getSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    })
    getSavedRecipes.mockResolvedValue([])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the bearer token to the meal-recipe API', async () => {
    mockInstructions()
    render(<Recipe />)

    await screen.findByText('Step-by-Step Guide')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/meal-recipe',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )
  })

  it('renders a Watch a tutorial link when a valid URL is returned', async () => {
    mockInstructions({
      tutorial_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })
    render(<Recipe />)

    const link = await screen.findByRole('link', {
      name: /watch a tutorial/i,
    })

    expect(link).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('hides the tutorial section when no URL is returned', async () => {
    mockInstructions()
    render(<Recipe />)

    await screen.findByText('Step-by-Step Guide')

    expect(
      screen.queryByRole('link', { name: /watch a tutorial/i }),
    ).not.toBeInTheDocument()
  })

  it('hides the tutorial section when the URL is not http(s)', async () => {
    mockInstructions({ tutorial_url: 'not-a-valid-url' })
    render(<Recipe />)

    await screen.findByText('Step-by-Step Guide')

    expect(
      screen.queryByRole('link', { name: /watch a tutorial/i }),
    ).not.toBeInTheDocument()
  })
})

describe('Recipe page saved recipes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.stubGlobal('fetch', fetchMock)
    seedRecipe()
    getSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    })
    getSavedRecipes.mockResolvedValue([])
    mockInstructions()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a save button once instructions are loaded', async () => {
    render(<Recipe />)

    const button = await screen.findByRole('button', { name: /save recipe/i })

    expect(button).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /saved/i })).not.toBeInTheDocument()
  })

  it('calls saveRecipe when the recipe is not saved yet', async () => {
    saveRecipe.mockResolvedValue({
      id: 'saved-1',
      recipe_name: 'Garlic Butter Chicken',
      description: '',
      ingredients: ['chicken', 'butter', 'garlic'],
      instructions: null,
      created_at: '2026-09-02T00:00:00Z',
    })

    render(<Recipe />)

    const button = await screen.findByRole('button', { name: /save recipe/i })
    button.click()

    await waitFor(() => {
      expect(saveRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe_name: 'Garlic Butter Chicken',
          ingredients: ['chicken', 'butter', 'garlic'],
        }),
      )
    })
  })

  it('shows as saved when the recipe is already in the collection', async () => {
    getSavedRecipes.mockResolvedValue([
      {
        id: 'saved-1',
        recipe_name: 'Garlic Butter Chicken',
        description: '',
        ingredients: ['chicken', 'butter', 'garlic'],
        instructions: null,
        created_at: '2026-09-02T00:00:00Z',
      },
    ])

    render(<Recipe />)

    const button = await screen.findByRole('button', { name: /saved/i })

    expect(button).toBeInTheDocument()
  })

  it('calls unlistRecipes when an already-saved recipe is un-saved', async () => {
    getSavedRecipes.mockResolvedValue([
      {
        id: 'saved-1',
        recipe_name: 'Garlic Butter Chicken',
        description: '',
        ingredients: ['chicken', 'butter', 'garlic'],
        instructions: null,
        created_at: '2026-09-02T00:00:00Z',
      },
    ])

    render(<Recipe />)

    const button = await screen.findByRole('button', { name: /saved/i })
    button.click()

    await waitFor(() => {
      expect(unlistRecipes).toHaveBeenCalledWith(['saved-1'])
    })
  })

  it('reuses persisted instructions and skips the meal-recipe API call', async () => {
    sessionStorage.setItem(
      'instructions',
      JSON.stringify({
        name: 'Garlic Butter Chicken',
        servings: 2,
        cook_time_minutes: 25,
        ingredients: [{ name: 'chicken', quantity: '500g' }],
        steps: [{ order: 1, title: 'Sear', instruction: 'Sear the chicken.' }],
        tips: ['Use high heat.'],
      }),
    )

    render(<Recipe />)

    await screen.findByText('Step-by-Step Guide')

    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/ai/meal-recipe',
      expect.anything(),
    )
  })
})
