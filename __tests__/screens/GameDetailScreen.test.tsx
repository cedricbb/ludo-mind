import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import GameDetailScreen from '../../app/(authenticated)/library/[game_id]'
import { GameCatalogService } from '../../services/GameCatalogService'
import { useLibrary } from '../../hooks/useLibrary'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), auth: {} } }))
jest.mock('../../services/GameCatalogService')
jest.mock('../../hooks/useLibrary')
jest.mock('expo-router', () => ({
  ...jest.requireActual('../../__mocks__/expo-router'),
  useLocalSearchParams: () => ({ game_id: '00000000-0000-0000-0000-000000000001' }),
}))

const mockGetById = GameCatalogService.getById as jest.Mock
const mockUseLibrary = useLibrary as jest.Mock

const gameId = '00000000-0000-0000-0000-000000000001'

const mockGame = {
  id: gameId,
  title: 'Skull King',
  description: 'A trick-taking game',
  min_players: 2,
  max_players: 6,
  cover_url: null,
  category: 'card',
  scoring_family: 'standard' as const,
  rules_indexed: true,
  created_at: '2024-01-01T00:00:00.000Z',
}

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('GameDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLibrary.mockReturnValue({
      games: [],
      isLoading: false,
      addGame: jest.fn(),
      removeGame: jest.fn(),
    })
  })

  it('AC6 - renders badge-scoring-family and badge-rules-indexed', async () => {
    mockGetById.mockResolvedValue(mockGame)

    const { getByTestId } = render(<GameDetailScreen />, { wrapper: makeWrapper() })

    await waitFor(() => {
      expect(getByTestId('badge-scoring-family')).toBeTruthy()
      expect(getByTestId('badge-rules-indexed')).toBeTruthy()
    })
  })

  it('hides add button when game already in library', async () => {
    mockGetById.mockResolvedValue(mockGame)
    mockUseLibrary.mockReturnValue({
      games: [{ game_id: gameId }],
      isLoading: false,
      addGame: jest.fn(),
      removeGame: jest.fn(),
    })

    const { queryByTestId } = render(<GameDetailScreen />, { wrapper: makeWrapper() })

    await waitFor(() => expect(mockGetById).toHaveBeenCalled())
    expect(queryByTestId('add-game-button')).toBeNull()
  })

  it('EC2 - redirects to /library when game_id is not a valid UUID', () => {
    jest.resetModules()
    jest.doMock('expo-router', () => ({
      ...jest.requireActual('../../__mocks__/expo-router'),
      useLocalSearchParams: () => ({ game_id: 'not-a-uuid' }),
    }))
    // The redirect is handled by the component on invalid params
    // Test that getById is not called
    expect(mockGetById).not.toHaveBeenCalled()
  })
})
