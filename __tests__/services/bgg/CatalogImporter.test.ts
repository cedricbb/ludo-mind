jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

jest.mock('../../../services/bgg/BggApiClient', () => ({
  BggApiClient: {
    fetchHot: jest.fn(),
    fetchDetails: jest.fn(),
  },
}))

import { CatalogImporter } from '../../../services/bgg/CatalogImporter'
import { supabase } from '../../../lib/supabase'
import { BggGameDetail } from '../../../services/bgg/types'

const mockFrom = supabase.from as jest.Mock

const validDetail: BggGameDetail = {
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

const trickTakingDetail: BggGameDetail = {
  bggId: 150145,
  title: 'Skull King',
  publisher: "Grandpa Beck's Games",
  minPlayers: 2,
  maxPlayers: 8,
  coverUrl: 'https://cf.geekdo-images.com/skull-king-thumb.jpg',
  mechanics: ['Trick-taking'],
  rating: 7.56,
  rank: 512,
}

describe('CatalogImporter.importBatch', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC-7: assigns numeric bgg_id for imported games', async () => {
    // SELECT returns no protected ids
    const mockIn = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    const mockSelectProtected = jest.fn().mockReturnValue({ in: mockIn })
    let upsertPayloadA: any[] = []
    const mockUpsert = jest.fn().mockImplementation((payload: any[]) => {
      upsertPayloadA = payload
      return Promise.resolve({ error: null })
    })
    mockFrom
      .mockReturnValueOnce({ select: mockSelectProtected })
      .mockReturnValueOnce({ upsert: mockUpsert })

    await CatalogImporter.importBatch([validDetail])

    expect(upsertPayloadA[0].bgg_id).toBe(92415)
    expect(typeof upsertPayloadA[0].bgg_id).toBe('number')
  })

  it('AC-6: pass B does not include scoring_family for protected games', async () => {
    // SELECT returns 92415 as protected
    const mockIn = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [{ bgg_id: 92415 }], error: null }),
    })
    const mockSelectProtected = jest.fn().mockReturnValue({ in: mockIn })
    let upsertPayloadB: any[] = []
    const mockUpsertB = jest.fn().mockImplementation((payload: any[]) => {
      upsertPayloadB = payload
      return Promise.resolve({ error: null })
    })
    mockFrom
      .mockReturnValueOnce({ select: mockSelectProtected })
      .mockReturnValueOnce({ upsert: mockUpsertB })

    await CatalogImporter.importBatch([validDetail])

    expect(upsertPayloadB).toHaveLength(1)
    expect(upsertPayloadB[0]).not.toHaveProperty('scoring_family')
    expect(upsertPayloadB[0]).not.toHaveProperty('rules_indexed')
  })

  it('skips invalid details and adds to errors', async () => {
    const invalidDetail = { ...validDetail, minPlayers: 10, maxPlayers: 2 }

    // No DB calls should happen since all are invalid
    const mockIn = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ in: mockIn }) })

    const report = await CatalogImporter.importBatch([invalidDetail])

    expect(report.skipped).toBe(1)
    expect(report.errors).toHaveLength(1)
    expect(report.errors[0].bggId).toBe(92415)
  })

  it('returns correct SeedReport on success', async () => {
    const mockIn = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    const mockSelectProtected = jest.fn().mockReturnValue({ in: mockIn })
    const mockUpsert = jest.fn().mockResolvedValue({ error: null })
    mockFrom
      .mockReturnValueOnce({ select: mockSelectProtected })
      .mockReturnValueOnce({ upsert: mockUpsert })

    const report = await CatalogImporter.importBatch([validDetail])

    expect(report.total).toBe(1)
    expect(report.inserted).toBe(1)
    expect(report.skipped).toBe(0)
    expect(report.errors).toHaveLength(0)
  })

  it('separates non-protected and protected into two passes', async () => {
    // validDetail (92415) is not protected, trickTakingDetail (150145) is protected
    const mockIn = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [{ bgg_id: 150145 }], error: null }),
    })
    const mockSelectProtected = jest.fn().mockReturnValue({ in: mockIn })

    let passAPayload: any[] = []
    let passBPayload: any[] = []
    const mockUpsertA = jest.fn().mockImplementation((payload: any[]) => {
      passAPayload = payload
      return Promise.resolve({ error: null })
    })
    const mockUpsertB = jest.fn().mockImplementation((payload: any[]) => {
      passBPayload = payload
      return Promise.resolve({ error: null })
    })
    mockFrom
      .mockReturnValueOnce({ select: mockSelectProtected })
      .mockReturnValueOnce({ upsert: mockUpsertA })
      .mockReturnValueOnce({ upsert: mockUpsertB })

    await CatalogImporter.importBatch([validDetail, trickTakingDetail])

    // Pass A should contain validDetail (non-protected) with scoring_family
    expect(passAPayload).toHaveLength(1)
    expect(passAPayload[0].bgg_id).toBe(92415)
    expect(passAPayload[0]).toHaveProperty('scoring_family')

    // Pass B should contain trickTakingDetail (protected) without scoring_family
    expect(passBPayload).toHaveLength(1)
    expect(passBPayload[0].bgg_id).toBe(150145)
    expect(passBPayload[0]).not.toHaveProperty('scoring_family')
  })
})
