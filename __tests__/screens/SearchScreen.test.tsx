import React from 'react'
import { render, fireEvent, act, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SearchScreen from '../../app/(authenticated)/library/search'
import { GameCatalogService } from '@/services/GameCatalogService'

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), auth: {} } }))
jest.mock('../../services/GameCatalogService')
jest.mock('expo-router')

const mockSearch = GameCatalogService.search as jest.Mock

const mockGame = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Skull King',
  description: null,
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

describe('SearchScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows hint when query < 2 chars', () => {
    const { getByText } = render(<SearchScreen />, { wrapper: makeWrapper() })
    expect(getByText(/au moins 2/i)).toBeTruthy()
  })

  it('does not call search when query < 2 chars', () => {
    render(<SearchScreen />, { wrapper: makeWrapper() })
    expect(mockSearch).not.toHaveBeenCalled()
  })

  it('renders game results when query >= 2 chars', async () => {
    mockSearch.mockResolvedValue([mockGame])
    jest.useFakeTimers()

    const { getByPlaceholderText, getByText } = render(<SearchScreen />, { wrapper: makeWrapper() })
    const input = getByPlaceholderText(/search/i)

    fireEvent.changeText(input, 'sk')
    act(() => { jest.advanceTimersByTime(300) })

    await waitFor(() => expect(mockSearch).toHaveBeenCalledWith('sk'))
    jest.useRealTimers()
  })
})
