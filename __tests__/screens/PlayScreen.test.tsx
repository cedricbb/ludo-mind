import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PlayScreen from '../../app/(authenticated)/session/[id]/play'
import { SessionService } from '@/services/SessionService'
import { useActiveSession } from '@/hooks/useActiveSession'
import { router, useLocalSearchParams } from '../../__mocks__/expo-router'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), auth: {} } }))
jest.mock('expo-secure-store')
jest.mock('expo-router')
jest.mock('../../services/SessionService')
jest.mock('../../hooks/useActiveSession')
jest.mock('../../services/GameCatalogService', () => ({
  GameCatalogService: {
    search: jest.fn().mockResolvedValue([]),
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
const mockUseActiveSession = useActiveSession as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock

const sessionId = '00000000-0000-0000-0000-000000000100'
const gameId = '00000000-0000-0000-0000-000000000001'
const userId = '00000000-0000-0000-0000-000000000010'
const playerId = '00000000-0000-0000-0000-000000000201'

const mockFullSession = {
  id: sessionId,
  user_id: userId,
  game_id: gameId,
  status: 'active' as const,
  players: [{ id: playerId, session_id: sessionId, display_name: 'Alice', order_index: 0 }],
  rounds: [],
  final_scores: null,
  created_at: '2026-04-20T10:00:00.000Z',
  ended_at: null,
}

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('PlayScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ id: sessionId })
    mockUseActiveSession.mockReturnValue({
      session: mockFullSession,
      isLoading: false,
      error: null,
      addRound: jest.fn().mockResolvedValue({}),
      endSession: jest.fn().mockResolvedValue({}),
    })
  })

  it('renders the play screen', async () => {
    mockGetById.mockResolvedValue(mockFullSession)

    const { getByTestId } = render(<PlayScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByTestId('play-screen')).toBeTruthy())
  })

  it('shows player score inputs', async () => {
    mockGetById.mockResolvedValue(mockFullSession)

    const { getByTestId } = render(<PlayScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByTestId(`score-input-${playerId}`)).toBeTruthy())
  })

  it('AC7 - fab-oracle navigates to /oracle/[game_id]', async () => {
    mockGetById.mockResolvedValue(mockFullSession)

    const { getByTestId } = render(<PlayScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByTestId('fab-oracle')).toBeTruthy())

    fireEvent.press(getByTestId('fab-oracle'))
    expect(router.push).toHaveBeenCalledWith(`/oracle/${gameId}`)
  })

  it('redirects to end screen when session status is finished', async () => {
    const finishedSession = { ...mockFullSession, status: 'finished' as const }
    mockGetById.mockResolvedValue(finishedSession)

    render(<PlayScreen />, { wrapper: makeWrapper() })

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith(`/session/${sessionId}/end`)
    })
  })

  it('end session button calls endSession and redirects', async () => {
    mockGetById.mockResolvedValue(mockFullSession)
    const mockEndSession = jest.fn().mockResolvedValue({})
    mockUseActiveSession.mockReturnValue({
      session: mockFullSession,
      isLoading: false,
      error: null,
      addRound: jest.fn(),
      endSession: mockEndSession,
    })

    const { getByTestId } = render(<PlayScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByTestId('end-session-button')).toBeTruthy())

    fireEvent.press(getByTestId('end-session-button'))

    await waitFor(() => {
      expect(mockEndSession).toHaveBeenCalled()
      expect(router.replace).toHaveBeenCalledWith(`/session/${sessionId}/end`)
    })
  })
})
