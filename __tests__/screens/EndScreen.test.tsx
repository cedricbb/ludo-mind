import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EndScreen from '../../app/(authenticated)/session/[id]/end'
import { SessionService } from '@/services/SessionService'
import { router, useLocalSearchParams } from '../../__mocks__/expo-router'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), auth: {} } }))
jest.mock('expo-secure-store')
jest.mock('expo-router')
jest.mock('../../services/SessionService')
jest.mock('../../services/GameCatalogService', () => ({
  GameCatalogService: {
    getById: jest.fn().mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Skull King',
      description: null,
      min_players: 2,
      max_players: 6,
      cover_url: null,
      category: 'card',
      scoring_family: 'standard',
      rules_indexed: true,
      created_at: '2024-01-01T00:00:00.000Z',
    }),
  },
}))

const mockGetById = SessionService.getById as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock

const sessionId = '00000000-0000-0000-0000-000000000100'
const gameId = '00000000-0000-0000-0000-000000000001'
const userId = '00000000-0000-0000-0000-000000000010'

const mockFinishedSession = {
  id: sessionId,
  user_id: userId,
  game_id: gameId,
  status: 'finished' as const,
  players: [
    { id: 'p1', session_id: sessionId, display_name: 'Alice', order_index: 0 },
    { id: 'p2', session_id: sessionId, display_name: 'Bob', order_index: 1 },
  ],
  rounds: [],
  final_scores: [
    { id: 'fs1', session_id: sessionId, player_id: 'p1', display_name: 'Alice', total: 100, rank: 1 },
    { id: 'fs2', session_id: sessionId, player_id: 'p2', display_name: 'Bob', total: 80, rank: 2 },
  ],
  created_at: '2026-04-20T10:00:00.000Z',
  ended_at: '2026-04-20T11:00:00.000Z',
}

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('EndScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ id: sessionId })
  })

  it('renders the end screen with podium', async () => {
    mockGetById.mockResolvedValue(mockFinishedSession)

    const { getByTestId } = render(<EndScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByTestId('end-screen')).toBeTruthy())
    expect(getByTestId('podium')).toBeTruthy()
  })

  it('shows all player scores sorted by rank', async () => {
    mockGetById.mockResolvedValue(mockFinishedSession)

    const { getByTestId } = render(<EndScreen />, { wrapper: makeWrapper() })

    await waitFor(() => {
      expect(getByTestId('score-row-rank-1')).toBeTruthy()
      expect(getByTestId('score-row-rank-2')).toBeTruthy()
    })
  })

  it('shows Alice as rank 1 with score 100', async () => {
    mockGetById.mockResolvedValue(mockFinishedSession)

    const { getByText } = render(<EndScreen />, { wrapper: makeWrapper() })

    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy()
      expect(getByText('100')).toBeTruthy()
    })
  })

  it('replay button navigates to /session/new', async () => {
    mockGetById.mockResolvedValue(mockFinishedSession)

    const { getByTestId } = render(<EndScreen />, { wrapper: makeWrapper() })

    await waitFor(() => expect(getByTestId('replay-button')).toBeTruthy())
    fireEvent.press(getByTestId('replay-button'))
    expect(router.push).toHaveBeenCalledWith('/session/new')
  })

  it('back button navigates to /', async () => {
    mockGetById.mockResolvedValue(mockFinishedSession)

    const { getByTestId } = render(<EndScreen />, { wrapper: makeWrapper() })

    await waitFor(() => expect(getByTestId('back-button')).toBeTruthy())
    fireEvent.press(getByTestId('back-button'))
    expect(router.push).toHaveBeenCalledWith('/')
  })
})
