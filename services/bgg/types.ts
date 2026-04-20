import { z } from 'zod'

export interface BggSearchResult {
  bggId: number
  title: string
}

export interface BggGameDetail {
  bggId: number
  title: string
  publisher: string
  minPlayers: number
  maxPlayers: number
  coverUrl: string
  mechanics: string[]
  rating: number
  rank: number | null
}

export type ScoringFamily =
  | 'standard'
  | 'positional'
  | 'elimination'
  | 'cooperative'
  | 'contract_tricks'
  | 'incremental'
  | 'custom'

export const ScoringFamilyMapping: Array<{ mechanic: string; family: ScoringFamily }> = [
  { mechanic: 'Trick-taking',                  family: 'contract_tricks' },
  { mechanic: 'Tile Placement',                family: 'incremental'     },
  { mechanic: 'Set Collection',                family: 'incremental'     },
  { mechanic: 'Area Majority / Influence',     family: 'incremental'     },
]

export interface SeedReport {
  total: number
  inserted: number
  skipped: number
  errors: Array<{ bggId: number; reason: string }>
}

export const BggGameDetailSchema = z.object({
  bggId:      z.number().int().positive(),
  title:      z.string().min(1),
  publisher:  z.string(),
  minPlayers: z.number().int().min(1),
  maxPlayers: z.number().int().min(1),
  coverUrl:   z.string().url(),
  mechanics:  z.array(z.string()),
  rating:     z.number().min(0),
  rank:       z.number().int().positive().nullable(),
}).refine(d => d.maxPlayers >= d.minPlayers, {
  message: 'maxPlayers must be >= minPlayers',
  path: ['maxPlayers'],
})

export class BggRetryExhaustedError extends Error {
  constructor(public url: string, public attempts: number) {
    super(`BGG retry exhausted after ${attempts} attempts: ${url}`)
    this.name = 'BggRetryExhaustedError'
  }
}

export class BggHttpError extends Error {
  constructor(public status: number, public url: string) {
    super(`BGG HTTP ${status}: ${url}`)
    this.name = 'BggHttpError'
  }
}
