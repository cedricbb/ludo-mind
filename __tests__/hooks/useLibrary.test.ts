import { renderHook, act, waitFor } from '@testing-library/react-native'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLibrary } from '@/hooks/useLibrary'
import { UserLibraryService } from '@/services/UserLibraryService'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), auth: {} } }))
jest.mock('../../services/UserLibraryService')
jest.mock('expo-secure-store')

const mockGetLibrary = UserLibraryService.getLibrary as jest.Mock
const mockAddGame = UserLibraryService.addGame as jest.Mock
const mockRemoveGame = UserLibraryService.removeGame as jest.Mock

const userId = '00000000-0000-0000-0000-000000000010'
const gameId = '00000000-0000-0000-0000-000000000001'

const mockUserGame = {
  id: '00000000-0000-0000-0000-000000000020',
  user_id: userId,
  game_id: gameId,
  added_at: '2024-01-01T00:00:00.000Z',
  last_played_at: null,
  play_count: 0,
  game: {
    id: gameId, title: 'Skull King', description: null,
    min_players: 2, max_players: 6, cover_url: null,
    category: 'card', scoring_family: 'standard', rules_indexed: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
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

describe('useLibrary', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns games from library', async () => {
    mockGetLibrary.mockResolvedValue([mockUserGame])

    const { result } = renderHook(() => useLibrary(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.games).toHaveLength(1)
  })

  it('AC5 - invalidates library cache after addGame', async () => {
    mockGetLibrary.mockResolvedValue([mockUserGame])
    mockAddGame.mockResolvedValue(mockUserGame)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const spy = jest.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useLibrary(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => { await result.current.addGame(gameId) })

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['library', userId] })
    )
  })

  it('AC5 - invalidates library cache after removeGame', async () => {
    mockGetLibrary.mockResolvedValue([mockUserGame])
    mockRemoveGame.mockResolvedValue(undefined)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const spy = jest.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useLibrary(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => { await result.current.removeGame(gameId) })

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['library', userId] })
    )
  })
})
