import { renderHook, act, waitFor } from '@testing-library/react-native'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useActiveSession } from '@/hooks/useActiveSession'
import { SessionService } from '@/services/SessionService'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), auth: {} } }))
jest.mock('../../services/SessionService')
jest.mock('expo-secure-store')

const mockGetHistory = SessionService.getHistory as jest.Mock
const mockAddRound = SessionService.addRound as jest.Mock
const mockEnd = SessionService.end as jest.Mock

const userId = '00000000-0000-0000-0000-000000000010'
const sessionId = '00000000-0000-0000-0000-000000000100'
const playerId = '00000000-0000-0000-0000-000000000201'

const mockActiveSessionItem = {
  id: sessionId,
  user_id: userId,
  game_id: '00000000-0000-0000-0000-000000000001',
  status: 'active' as const,
  players: [{ id: playerId, session_id: sessionId, display_name: 'Alice', order_index: 0 }],
  rounds: [],
  final_scores: null,
  created_at: '2026-04-20T10:00:00.000Z',
  ended_at: null,
}

const mockSession = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.sig',
  refresh_token: 'refresh',
  user: {
    id: userId, email: 'test@test.com', display_name: 'Test',
    avatar_url: null, plan: 'free', created_at: '2024-01-01T00:00:00.000Z',
  },
}

jest.mock('../../hooks/useSession', () => ({
  useSession: () => ({ session: mockSession, isLoading: false }),
}))

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useActiveSession', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns null session when no active sessions', async () => {
    mockGetHistory.mockResolvedValue([])

    const { result } = renderHook(() => useActiveSession(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.session).toBeNull()
  })

  it('returns active session from history', async () => {
    mockGetHistory.mockResolvedValue([mockActiveSessionItem])

    const { result } = renderHook(() => useActiveSession(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.session).not.toBeNull()
    expect(result.current.session?.status).toBe('active')
  })

  it('rejects addRound when no active session', async () => {
    mockGetHistory.mockResolvedValue([])

    const { result } = renderHook(() => useActiveSession(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(
      act(async () => { await result.current.addRound([{ player_id: playerId, score: 10 }]) })
    ).rejects.toThrow('No active session')
  })

  it('rejects endSession when no active session', async () => {
    mockGetHistory.mockResolvedValue([])

    const { result } = renderHook(() => useActiveSession(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(
      act(async () => { await result.current.endSession() })
    ).rejects.toThrow('No active session')
  })

  it('calls SessionService.addRound when active session exists', async () => {
    mockGetHistory.mockResolvedValue([mockActiveSessionItem])
    mockAddRound.mockResolvedValue({
      id: 'r1', session_id: sessionId, round_number: 1,
      results: [{ player_id: playerId, score: 10 }],
      created_at: '2026-04-20T10:00:00.000Z',
    })

    const { result } = renderHook(() => useActiveSession(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addRound([{ player_id: playerId, score: 10 }])
    })

    expect(mockAddRound).toHaveBeenCalledWith(sessionId, [{ player_id: playerId, score: 10 }])
  })
})
