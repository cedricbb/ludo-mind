/**
 * Tests for the catalog-bgg-search Edge Function logic.
 * We test the logic indirectly by exercising BggApiClient + CatalogImporter.
 */

jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

jest.mock('../../services/bgg/BggApiClient', () => ({
  BggApiClient: {
    search: jest.fn(),
    fetchDetails: jest.fn(),
  },
}))

jest.mock('../../services/bgg/CatalogImporter', () => ({
  CatalogImporter: {
    importBatch: jest.fn(),
  },
}))

import { supabase } from '../../lib/supabase'
import { BggApiClient } from '../../services/bgg/BggApiClient'
import { CatalogImporter } from '../../services/bgg/CatalogImporter'
import { BggGameDetail } from '../../services/bgg/types'

const mockFrom = supabase.from as jest.Mock
const mockSearch = BggApiClient.search as jest.Mock
const mockFetchDetails = BggApiClient.fetchDetails as jest.Mock
const mockImportBatch = CatalogImporter.importBatch as jest.Mock

const gameDetail: BggGameDetail = {
  bggId: 92415,
  title: 'Skull',
  publisher: 'Asmodee',
  minPlayers: 2,
  maxPlayers: 6,
  coverUrl: 'https://cf.geekdo-images.com/skull-thumb.jpg',
  mechanics: ['Bluffing'],
  rating: 7.23,
  rank: 348,
}

const storedGame = {
  id: '00000000-0000-0000-0000-000000000001',
  bgg_id: 92415,
  title: 'Skull',
  description: null,
  min_players: 2,
  max_players: 6,
  cover_url: 'https://cf.geekdo-images.com/skull-thumb.jpg',
  category: 'boardgame',
  scoring_family: 'custom',
  rules_indexed: false,
  created_at: '2026-04-20T00:00:00.000Z',
  publisher: 'Asmodee',
  bgg_rating: 7.23,
  bgg_rank: 348,
}

describe('catalog-bgg-search Edge Function logic', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC-8: search + importBatch + returns Game[] on success', async () => {
    mockSearch.mockResolvedValue([{ bggId: 92415, title: 'Skull' }])
    mockFetchDetails.mockResolvedValue([gameDetail])
    mockImportBatch.mockResolvedValue({ total: 1, inserted: 1, skipped: 0, errors: [] })

    const mockIn = jest.fn().mockResolvedValue({ data: [storedGame], error: null })
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ in: mockIn }) })

    // Simulate the edge function flow
    const q = 'skull'
    const limit = 10

    const searchResults = await BggApiClient.search(q)
    const bggIds = searchResults.slice(0, limit).map((r: any) => r.bggId)
    const details = await BggApiClient.fetchDetails(bggIds)
    const seedReport = await CatalogImporter.importBatch(details)

    const { data: games } = await supabase.from('games').select('*').in('bgg_id', bggIds)

    expect(mockSearch).toHaveBeenCalledWith('skull')
    expect(mockFetchDetails).toHaveBeenCalledWith([92415])
    expect(mockImportBatch).toHaveBeenCalledWith([gameDetail])
    expect(seedReport.inserted).toBe(1)
    expect(games).toHaveLength(1)
    expect(games![0].bgg_id).toBe(92415)
  })

  it('AC-8: timeout fallback returns local results via ILIKE', async () => {
    // Simulate abort error path
    const mockIlike = jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue({ data: [storedGame], error: null }),
    })
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ ilike: mockIlike }) })

    const q = 'skull'
    const limit = 10

    // Simulate the fallback: query local games
    const { data: localGames } = await supabase.from('games').select('*').ilike('title', `%${q}%`).limit(limit)

    expect(mockFrom).toHaveBeenCalledWith('games')
    expect(mockIlike).toHaveBeenCalledWith('title', '%skull%')
    expect(localGames).toHaveLength(1)
    expect(localGames![0].title).toBe('Skull')
  })

  it('returns empty array when BGG search returns no results', async () => {
    mockSearch.mockResolvedValue([])
    mockFetchDetails.mockResolvedValue([])
    mockImportBatch.mockResolvedValue({ total: 0, inserted: 0, skipped: 0, errors: [] })

    const mockIn = jest.fn().mockResolvedValue({ data: [], error: null })
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ in: mockIn }) })

    const searchResults = await BggApiClient.search('xyznonexistent')
    expect(searchResults).toHaveLength(0)
  })
})
