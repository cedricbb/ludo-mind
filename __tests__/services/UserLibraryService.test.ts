jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

import { UserLibraryService } from '../../services/UserLibraryService'
import { ConflictError, NotFoundError } from '../../lib/errors'
import { supabase } from '../../lib/supabase'

const mockFrom = supabase.from as jest.Mock

const userId = '00000000-0000-0000-0000-000000000010'
const gameId = '00000000-0000-0000-0000-000000000001'

const mockGame = {
  id: gameId, title: 'Skull King', description: null,
  min_players: 2, max_players: 6, cover_url: null,
  category: 'card', scoring_family: 'standard',
  rules_indexed: true, created_at: '2024-01-01T00:00:00.000Z',
}

const mockUserGame = {
  id: '00000000-0000-0000-0000-000000000020',
  user_id: userId, game_id: gameId,
  added_at: '2024-01-01T00:00:00.000Z', last_played_at: null,
  play_count: 0, game: mockGame,
}

describe('UserLibraryService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getLibrary', () => {
    it('returns UserGame[]', async () => {
      const mockEq = jest.fn().mockResolvedValue({ data: [mockUserGame], error: null })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const result = await UserLibraryService.getLibrary(userId)
      expect(result).toHaveLength(1)
      expect(result[0].game.title).toBe('Skull King')
    })
  })

  describe('addGame', () => {
    it('returns UserGame on success', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: mockUserGame, error: null })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockFrom.mockReturnValue({ insert: mockInsert })

      const result = await UserLibraryService.addGame(userId, gameId)
      expect(result.game_id).toBe(gameId)
    })

    it('AC2 - throws ConflictError on duplicate (23505)', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate' } })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockFrom.mockReturnValue({ insert: mockInsert })

      await expect(UserLibraryService.addGame(userId, gameId)).rejects.toThrow(ConflictError)
    })

    it('throws NotFoundError on PGRST116', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockFrom.mockReturnValue({ insert: mockInsert })

      await expect(UserLibraryService.addGame(userId, gameId)).rejects.toThrow(NotFoundError)
    })
  })

  describe('removeGame', () => {
    it('resolves on success', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ error: null })
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 })
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq1 })
      mockFrom.mockReturnValue({ delete: mockDelete })

      await expect(UserLibraryService.removeGame(userId, gameId)).resolves.toBeUndefined()
    })

    it('throws NotFoundError on PGRST116', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({ error: { code: 'PGRST116', message: 'not found' } })
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 })
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq1 })
      mockFrom.mockReturnValue({ delete: mockDelete })

      await expect(UserLibraryService.removeGame(userId, gameId)).rejects.toThrow(NotFoundError)
    })
  })
})
