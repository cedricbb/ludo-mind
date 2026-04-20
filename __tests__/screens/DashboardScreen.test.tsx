import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardScreen from '../../app/(authenticated)/index'
import { useActiveSession } from '@/hooks/useActiveSession'
import { router } from '../../__mocks__/expo-router'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), auth: {} } }))
jest.mock('expo-secure-store')
jest.mock('expo-router')
jest.mock('../../hooks/useActiveSession')
jest.mock('../../hooks/useSession', () => ({
  useSession: () => ({
    session: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.sig',
      refresh_token: 'refresh',
      user: {
        id: '00000000-0000-0000-0000-000000000010',
        email: 'test@test.com',
        display_name: 'Test',
        avatar_url: null,
        plan: 'free',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    },
    isLoading: false,
  }),
}))
jest.mock('../../services/GameCatalogService', () => ({
  GameCatalogService: {
    search: jest.fn().mockResolvedValue([]),
    getById: jest.fn(),
  },
}))

const mockUseActiveSession = useActiveSession as jest.Mock

const sessionId = '00000000-0000-0000-0000-000000000100'
const gameId = '00000000-0000-0000-0000-000000000001'
const userId = '00000000-0000-0000-0000-000000000010'

const mockGame = {
  id: gameId, title: 'Skull King', description: null,
  min_players: 2, max_players: 6, cover_url: null,
  category: 'card', scoring_family: 'standard', rules_indexed: true,
  created_at: '2024-01-01T00:00:00.000Z',
}

const mockActiveSessionItem = {
  id: sessionId,
  user_id: userId,
  game_id: gameId,
  status: 'active' as const,
  players: [{ id: 'p1', session_id: sessionId, display_name: 'Alice', order_index: 0 }],
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

describe('DashboardScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows start-new-game-card when no active session', async () => {
    mockUseActiveSession.mockReturnValue({
      session: null,
      isLoading: false,
      error: null,
      addRound: jest.fn(),
      endSession: jest.fn(),
    })

    const { getByTestId } = render(<DashboardScreen />, { wrapper: makeWrapper() })
    expect(getByTestId('start-new-game-card')).toBeTruthy()
  })

  it('AC4 - shows active-session-card when session is active', async () => {
    const { GameCatalogService } = require('../../services/GameCatalogService')
    GameCatalogService.getById.mockResolvedValue(mockGame)

    mockUseActiveSession.mockReturnValue({
      session: mockActiveSessionItem,
      isLoading: false,
      error: null,
      addRound: jest.fn(),
      endSession: jest.fn(),
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['games', sessionId], mockGame)

    const { getByTestId } = render(<DashboardScreen />, {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    })

    await waitFor(() => {
      expect(getByTestId('active-session-card')).toBeTruthy()
    })
  })

  it('AC4 - shows oracle-suggestion-box when session is active', async () => {
    const { GameCatalogService } = require('../../services/GameCatalogService')
    GameCatalogService.getById.mockResolvedValue(mockGame)

    mockUseActiveSession.mockReturnValue({
      session: mockActiveSessionItem,
      isLoading: false,
      error: null,
      addRound: jest.fn(),
      endSession: jest.fn(),
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['games', gameId], mockGame)

    const { getByTestId } = render(<DashboardScreen />, {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    })

    await waitFor(() => {
      expect(getByTestId('oracle-suggestion-box')).toBeTruthy()
    })
  })

  it('AC6 - quick-action-ask-rule navigates to /oracle/[game_id]', async () => {
    mockUseActiveSession.mockReturnValue({
      session: mockActiveSessionItem,
      isLoading: false,
      error: null,
      addRound: jest.fn(),
      endSession: jest.fn(),
    })

    const { GameCatalogService } = require('../../services/GameCatalogService')
    GameCatalogService.getById.mockResolvedValue(mockGame)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['games', gameId], mockGame)

    const { getByTestId } = render(<DashboardScreen />, {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    })

    fireEvent.press(getByTestId('quick-action-ask-rule'))
    expect(router.push).toHaveBeenCalledWith(`/oracle/${gameId}`)
  })

  it('AC6 - quick-action-scan-score navigates to /scan/[game_id]', async () => {
    mockUseActiveSession.mockReturnValue({
      session: mockActiveSessionItem,
      isLoading: false,
      error: null,
      addRound: jest.fn(),
      endSession: jest.fn(),
    })

    const { GameCatalogService } = require('../../services/GameCatalogService')
    GameCatalogService.getById.mockResolvedValue(mockGame)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { getByTestId } = render(<DashboardScreen />, {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    })

    fireEvent.press(getByTestId('quick-action-scan-score'))
    expect(router.push).toHaveBeenCalledWith(`/scan/${gameId}`)
  })

  it('shows loading indicator while loading session', () => {
    mockUseActiveSession.mockReturnValue({
      session: null,
      isLoading: true,
      error: null,
      addRound: jest.fn(),
      endSession: jest.fn(),
    })

    const { queryByTestId } = render(<DashboardScreen />, { wrapper: makeWrapper() })
    expect(queryByTestId('start-new-game-card')).toBeNull()
  })
})
