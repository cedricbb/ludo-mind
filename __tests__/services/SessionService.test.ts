jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

import { SessionService, computeFinalScores } from '../../services/SessionService'
import { ConflictError, NotFoundError } from '../../lib/errors'
import { supabase } from '../../lib/supabase'

const mockFrom = supabase.from as jest.Mock

const userId = '00000000-0000-0000-0000-000000000010'
const gameId = '00000000-0000-0000-0000-000000000001'
const sessionId = '00000000-0000-0000-0000-000000000100'
const playerId1 = '00000000-0000-0000-0000-000000000201'
const playerId2 = '00000000-0000-0000-0000-000000000202'
const playerId3 = '00000000-0000-0000-0000-000000000203'

const mockPlayer1 = {
  id: playerId1, session_id: sessionId, display_name: 'Alice', order_index: 0,
}
const mockPlayer2 = {
  id: playerId2, session_id: sessionId, display_name: 'Bob', order_index: 1,
}

const mockRound1 = {
  id: '00000000-0000-0000-0000-000000000301',
  session_id: sessionId,
  round_number: 1,
  results: JSON.stringify([{ player_id: playerId1, score: 10 }, { player_id: playerId2, score: 5 }]),
  created_at: '2026-04-20T10:00:00.000Z',
}

const mockActiveSession = {
  id: sessionId,
  user_id: userId,
  game_id: gameId,
  status: 'active',
  created_at: '2026-04-20T10:00:00.000Z',
  ended_at: null,
  game_session_players: [mockPlayer1, mockPlayer2],
  game_session_rounds: [],
  game_session_final_scores: [],
}

const mockFinishedSession = {
  ...mockActiveSession,
  status: 'finished',
  ended_at: '2026-04-20T11:00:00.000Z',
  game_session_rounds: [mockRound1],
}

function mockFetchSession(session: any) {
  const mockEq = jest.fn().mockResolvedValue({ data: [session], error: null })
  const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
}

describe('SessionService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('computeFinalScores', () => {
    const players = [
      { id: playerId1, session_id: sessionId, display_name: 'Alice', order_index: 0 },
      { id: playerId2, session_id: sessionId, display_name: 'Bob', order_index: 1 },
      { id: playerId3, session_id: sessionId, display_name: 'Carol', order_index: 2 },
    ]

    it('calculates totals and ranks correctly', () => {
      const rounds = [
        {
          id: 'r1', session_id: sessionId, round_number: 1, created_at: '2026-04-20T10:00:00.000Z',
          results: [
            { player_id: playerId1, score: 100 },
            { player_id: playerId2, score: 50 },
            { player_id: playerId3, score: 80 },
          ],
        },
      ]
      const scores = computeFinalScores(players, rounds)
      expect(scores[0].total).toBe(100)
      expect(scores[0].rank).toBe(1)
      expect(scores[1].total).toBe(80)
      expect(scores[1].rank).toBe(2)
      expect(scores[2].total).toBe(50)
      expect(scores[2].rank).toBe(3)
    })

    it('handles dense rank for ex-æquo: totals [100, 80, 80] → ranks [1, 2, 2]', () => {
      const rounds = [
        {
          id: 'r1', session_id: sessionId, round_number: 1, created_at: '2026-04-20T10:00:00.000Z',
          results: [
            { player_id: playerId1, score: 100 },
            { player_id: playerId2, score: 80 },
            { player_id: playerId3, score: 80 },
          ],
        },
      ]
      const scores = computeFinalScores(players, rounds)
      expect(scores[0].rank).toBe(1)
      expect(scores[1].rank).toBe(2)
      expect(scores[2].rank).toBe(2)
    })

    it('handles dense rank: totals [100, 80, 50] → ranks [1, 2, 3]', () => {
      const rounds = [
        {
          id: 'r1', session_id: sessionId, round_number: 1, created_at: '2026-04-20T10:00:00.000Z',
          results: [
            { player_id: playerId1, score: 100 },
            { player_id: playerId2, score: 80 },
            { player_id: playerId3, score: 50 },
          ],
        },
      ]
      const scores = computeFinalScores(players, rounds)
      expect(scores.map(s => s.rank)).toEqual([1, 2, 3])
    })

    it('handles 0 rounds: all totals = 0, all rank = 1', () => {
      const scores = computeFinalScores(players, [])
      expect(scores.every(s => s.total === 0)).toBe(true)
      expect(scores.every(s => s.rank === 1)).toBe(true)
    })
  })

  describe('create', () => {
    it('AC1 - initializes session with status=active and final_scores=null', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: sessionId }, error: null })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })

      const mockPlayersInsert = jest.fn().mockResolvedValue({ error: null })

      const mockFetchEq = jest.fn().mockResolvedValue({ data: [mockActiveSession], error: null })
      const mockFetchSelect = jest.fn().mockReturnValue({ eq: mockFetchEq })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) return { insert: mockInsert }
        if (callCount === 2) return { insert: mockPlayersInsert }
        return { select: mockFetchSelect }
      })

      const session = await SessionService.create(gameId, [
        { display_name: 'Alice' },
        { display_name: 'Bob' },
      ])

      expect(session.status).toBe('active')
      expect(session.final_scores).toBeNull()
    })

    it('throws Error("display_name required") for blank display_name', async () => {
      await expect(
        SessionService.create(gameId, [{ display_name: '  ' }])
      ).rejects.toThrow('display_name required')
    })
  })

  describe('addRound', () => {
    it('AC2 - throws ConflictError when session is finished', async () => {
      mockFetchSession(mockFinishedSession)

      await expect(
        SessionService.addRound(sessionId, [{ player_id: playerId1, score: 10 }])
      ).rejects.toBeInstanceOf(ConflictError)
    })

    it('inserts a round for active session', async () => {
      const insertedRound = {
        id: '00000000-0000-0000-0000-000000000300',
        session_id: sessionId,
        round_number: 1,
        results: JSON.stringify([{ player_id: playerId1, score: 10 }]),
        created_at: '2026-04-20T10:00:00.000Z',
      }

      const mockFetchEq = jest.fn().mockResolvedValue({ data: [mockActiveSession], error: null })
      const mockFetchSelect = jest.fn().mockReturnValue({ eq: mockFetchEq })

      const mockSingle = jest.fn().mockResolvedValue({ data: insertedRound, error: null })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) return { select: mockFetchSelect }
        return { insert: mockInsert }
      })

      const round = await SessionService.addRound(sessionId, [{ player_id: playerId1, score: 10 }])
      expect(round.round_number).toBe(1)
    })
  })

  describe('end', () => {
    it('AC2 - throws ConflictError when session is already finished', async () => {
      mockFetchSession(mockFinishedSession)

      await expect(SessionService.end(sessionId)).rejects.toBeInstanceOf(ConflictError)
    })

    it('marks session as finished and returns updated session', async () => {
      const finishedRow = { ...mockFinishedSession, status: 'finished' }

      const mockFetchEq1 = jest.fn().mockResolvedValue({ data: [mockActiveSession], error: null })
      const mockFetchSelect1 = jest.fn().mockReturnValue({ eq: mockFetchEq1 })

      const mockScoresInsert = jest.fn().mockResolvedValue({ error: null })
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq })
      const mockUserGameEq2 = jest.fn().mockResolvedValue({ error: null })
      const mockUserGameEq1 = jest.fn().mockReturnValue({ eq: mockUserGameEq2 })
      const mockUserGameUpdate = jest.fn().mockReturnValue({ eq: mockUserGameEq1 })

      const mockFetchEq2 = jest.fn().mockResolvedValue({ data: [finishedRow], error: null })
      const mockFetchSelect2 = jest.fn().mockReturnValue({ eq: mockFetchEq2 })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) return { select: mockFetchSelect1 }
        if (callCount === 2) return { insert: mockScoresInsert }
        if (callCount === 3) return { update: mockUpdate }
        if (callCount === 4) return { update: mockUserGameUpdate }
        return { select: mockFetchSelect2 }
      })

      const session = await SessionService.end(sessionId)
      expect(session.status).toBe('finished')
    })
  })

  describe('getHistory', () => {
    it('returns list of sessions for user', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: [mockActiveSession], error: null })
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      const sessions = await SessionService.getHistory(userId)
      expect(sessions).toHaveLength(1)
      expect(sessions[0].status).toBe('active')
    })
  })

  describe('getById', () => {
    it('throws NotFoundError when session not found', async () => {
      const mockEq = jest.fn().mockResolvedValue({ data: [], error: null })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      mockFrom.mockReturnValue({ select: mockSelect })

      await expect(SessionService.getById(sessionId)).rejects.toBeInstanceOf(NotFoundError)
    })
  })
})
