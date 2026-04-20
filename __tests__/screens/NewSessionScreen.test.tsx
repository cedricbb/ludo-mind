import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewSessionScreen from '../../app/(authenticated)/session/new'
import { SessionService } from '@/services/SessionService'
import { router } from '../../__mocks__/expo-router'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), auth: {} } }))
jest.mock('expo-secure-store')
jest.mock('expo-router')
jest.mock('../../services/SessionService')
jest.mock('../../services/GameCatalogService', () => ({
  GameCatalogService: {
    search: jest.fn().mockResolvedValue([
      {
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
      },
    ]),
    getById: jest.fn(),
  },
}))

const mockCreate = SessionService.create as jest.Mock

const sessionId = '00000000-0000-0000-0000-000000000100'
const gameId = '00000000-0000-0000-0000-000000000001'
const userId = '00000000-0000-0000-0000-000000000010'

const mockCreatedSession = {
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

describe('NewSessionScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the screen title', () => {
    const { getByText } = render(<NewSessionScreen />, { wrapper: makeWrapper() })
    expect(getByText('New Game')).toBeTruthy()
  })

  it('shows available games from catalog', async () => {
    const { getByText } = render(<NewSessionScreen />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect(getByText('Skull King')).toBeTruthy()
    })
  })

  it('adds a player when add button is pressed', async () => {
    const { getByTestId } = render(<NewSessionScreen />, { wrapper: makeWrapper() })

    fireEvent.changeText(getByTestId('player-name-input'), 'Alice')
    fireEvent.press(getByTestId('add-player-button'))

    expect(getByTestId('player-chip-0')).toBeTruthy()
  })

  it('start button is disabled when no game selected or no players', async () => {
    const { getByTestId } = render(<NewSessionScreen />, { wrapper: makeWrapper() })
    const startButton = getByTestId('start-session-button')
    expect(startButton.props.accessibilityState?.disabled).toBeTruthy()
  })

  it('navigates to play screen after successful session creation', async () => {
    mockCreate.mockResolvedValue(mockCreatedSession)

    const { getByTestId, getByText } = render(<NewSessionScreen />, { wrapper: makeWrapper() })

    await waitFor(() => expect(getByText('Skull King')).toBeTruthy())

    fireEvent.press(getByText('Skull King'))
    fireEvent.changeText(getByTestId('player-name-input'), 'Alice')
    fireEvent.press(getByTestId('add-player-button'))
    fireEvent.press(getByTestId('start-session-button'))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(gameId, [{ display_name: 'Alice' }])
      expect(router.replace).toHaveBeenCalledWith(`/session/${sessionId}/play`)
    })
  })
})
