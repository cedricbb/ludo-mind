jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

import { GameCatalogService } from '../../services/GameCatalogService'
import { supabase } from '../../lib/supabase'

const mockFrom = supabase.from as jest.Mock

const mockGame = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Skull King',
  description: 'A trick-taking game',
  min_players: 2,
  max_players: 6,
  cover_url: null,
  category: 'card',
  scoring_family: 'standard',
  rules_indexed: true,
  created_at: '2024-01-01T00:00:00.000Z',
}

describe('GameCatalogService.search', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC1 - calls ilike with correct pattern and returns Game[]', async () => {
    const mockIlike = jest.fn().mockResolvedValue({ data: [mockGame], error: null })
    const mockSelect = jest.fn().mockReturnValue({ ilike: mockIlike })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await GameCatalogService.search('skull')

    expect(mockFrom).toHaveBeenCalledWith('games')
    expect(mockIlike).toHaveBeenCalledWith('title', '%skull%')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Skull King')
  })

  it('returns empty array when no results', async () => {
    const mockIlike = jest.fn().mockResolvedValue({ data: [], error: null })
    const mockSelect = jest.fn().mockReturnValue({ ilike: mockIlike })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await GameCatalogService.search('nonexistent')
    expect(result).toEqual([])
  })

  it('throws on supabase error', async () => {
    const mockIlike = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const mockSelect = jest.fn().mockReturnValue({ ilike: mockIlike })
    mockFrom.mockReturnValue({ select: mockSelect })

    await expect(GameCatalogService.search('skull')).rejects.toThrow()
  })
})
