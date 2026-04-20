import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LibraryScreen from '../../app/(authenticated)/library/index'
import { useLibrary } from '@/hooks/useLibrary'
import { router } from '@/__mocks__/expo-router'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), auth: {} } }))
jest.mock('expo-secure-store')
jest.mock('../../hooks/useLibrary')
jest.mock('expo-router')

const mockUseLibrary = useLibrary as jest.Mock

const userId = '00000000-0000-0000-0000-000000000010'
const gameId = '00000000-0000-0000-0000-000000000001'

const mockUserGame = {
  id: '00000000-0000-0000-0000-000000000020',
  user_id: userId,
  game_id: gameId,
  added_at: '2024-01-01T00:00:00.000Z',
  last_played_at: null,
  play_count: 3,
  game: {
    id: gameId, title: 'Skull King', description: null,
    min_players: 2, max_players: 6, cover_url: null,
    category: 'card', scoring_family: 'standard' as const, rules_indexed: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
}

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('LibraryScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC3 - renders FeaturedGameCard for first game', async () => {
    mockUseLibrary.mockReturnValue({
      games: [mockUserGame],
      isLoading: false,
      addGame: jest.fn(),
      removeGame: jest.fn(),
    })

    const { getByTestId } = render(<LibraryScreen />, { wrapper: makeWrapper() })
    expect(getByTestId('featured-game-card')).toBeTruthy()
  })

  it('AC4 - GhostAddCard navigates to /library/search on press', async () => {
    mockUseLibrary.mockReturnValue({
      games: [],
      isLoading: false,
      addGame: jest.fn(),
      removeGame: jest.fn(),
    })

    const { getByTestId } = render(<LibraryScreen />, { wrapper: makeWrapper() })
    fireEvent.press(getByTestId('ghost-add-card'))
    expect(router.push).toHaveBeenCalledWith('/library/search')
  })

  it('renders header title Your Vault and subtitle with game count', () => {
    mockUseLibrary.mockReturnValue({
      games: [mockUserGame],
      isLoading: false,
      addGame: jest.fn(),
      removeGame: jest.fn(),
    })

    const { getByText } = render(<LibraryScreen />, { wrapper: makeWrapper() })
    expect(getByText('Your Vault')).toBeTruthy()
    expect(getByText('Commanding 1 titles across the multiverse.')).toBeTruthy()
  })

  it('shows GhostAddCard at end when games exist', () => {
    mockUseLibrary.mockReturnValue({
      games: [mockUserGame, { ...mockUserGame, id: 'other' }],
      isLoading: false,
      addGame: jest.fn(),
      removeGame: jest.fn(),
    })

    const { getByTestId } = render(<LibraryScreen />, { wrapper: makeWrapper() })
    expect(getByTestId('ghost-add-card')).toBeTruthy()
  })
})
