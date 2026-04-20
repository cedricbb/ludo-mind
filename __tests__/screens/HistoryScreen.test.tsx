import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HistoryScreen from '../../app/(authenticated)/session/history'
import { SessionService } from '@/services/SessionService'
import { router } from '../../__mocks__/expo-router'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), auth: {} } }))
jest.mock('expo-secure-store')
jest.mock('expo-router')
jest.mock('../../services/SessionService')
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

const mockGetHistory = SessionService.getHistory as jest.Mock

const sessionId = '00000000-0000-0000-0000-000000000100'
const gameId = '00000000-0000-0000-0000-000000000001'
const userId = '00000000-0000-0000-0000-000000000010'

const mockSession = {
  id: sessionId,
  user_id: userId,
  game_id: gameId,
  status: 'finished' as const,
  players: [],
  rounds: [],
  final_scores: null,
  created_at: '2026-04-20T10:00:00.000Z',
  ended_at: '2026-04-20T11:00:00.000Z',
}

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('HistoryScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the history screen', () => {
    mockGetHistory.mockResolvedValue([])
    const { getByTestId } = render(<HistoryScreen />, { wrapper: makeWrapper() })
    expect(getByTestId('history-screen')).toBeTruthy()
  })

  it('shows empty state when no sessions', async () => {
    mockGetHistory.mockResolvedValue([])

    const { getByText } = render(<HistoryScreen />, { wrapper: makeWrapper() })
    await waitFor(() => expect(getByText('No play history yet')).toBeTruthy())
  })

  it('shows session cards when sessions exist', async () => {
    mockGetHistory.mockResolvedValue([mockSession])

    const { getByTestId } = render(<HistoryScreen />, { wrapper: makeWrapper() })

    await waitFor(() => {
      expect(getByTestId(`session-card-${sessionId}`)).toBeTruthy()
    })
  })

  it('navigates to end screen on session card press', async () => {
    mockGetHistory.mockResolvedValue([mockSession])

    const { getByTestId } = render(<HistoryScreen />, { wrapper: makeWrapper() })

    await waitFor(() => expect(getByTestId(`session-card-${sessionId}`)).toBeTruthy())
    fireEvent.press(getByTestId(`session-card-${sessionId}`))

    expect(router.push).toHaveBeenCalledWith(`/session/${sessionId}/end`)
  })

  it('Collection tab navigates to /library', () => {
    mockGetHistory.mockResolvedValue([])

    const { getByTestId } = render(<HistoryScreen />, { wrapper: makeWrapper() })
    fireEvent.press(getByTestId('tab-collection'))

    expect(router.replace).toHaveBeenCalledWith('/library')
  })
})
