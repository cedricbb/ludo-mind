import { supabase } from '@/lib/supabase'
import {
  GameSession, GameSessionSchema,
  GameSessionListItem, GameSessionListItemSchema,
  Player,
  Round, RoundSchema,
  RoundResult,
} from '@/lib/schemas'
import { NotFoundError, ConflictError } from '@/lib/errors'

export function computeFinalScores(
  players: Player[],
  rounds: Round[]
): Array<{ player_id: string; display_name: string; total: number; rank: number }> {
  const totals = players.map(player => {
    const total = rounds.reduce((sum, round) => {
      const result = round.results.find(r => r.player_id === player.id)
      return sum + (result ? result.score : 0)
    }, 0)
    return { player_id: player.id, display_name: player.display_name, total }
  })

  totals.sort((a, b) => b.total - a.total)

  let rank = 1
  for (let i = 0; i < totals.length; i++) {
    if (i > 0 && totals[i].total < totals[i - 1].total) {
      rank = i + 1
    }
    ;(totals[i] as any).rank = rank
  }

  return totals as Array<{ player_id: string; display_name: string; total: number; rank: number }>
}

async function _fetchSessionById(sessionId: string): Promise<GameSession> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select(`
      *,
      game_session_players(*),
      game_session_rounds(*),
      game_session_final_scores(*)
    `)
    .eq('id', sessionId)

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new NotFoundError()

  const row = data[0]
  return GameSessionSchema.parse({
    ...row,
    players: row.game_session_players ?? [],
    rounds: (row.game_session_rounds ?? []).map((r: any) => ({
      ...r,
      results: typeof r.results === 'string' ? JSON.parse(r.results) : r.results,
    })),
    final_scores: row.game_session_final_scores?.length ? row.game_session_final_scores : null,
  })
}

export const SessionService = {
  async create(gameId: string, players: Array<{ display_name: string }>): Promise<GameSession> {
    for (const p of players) {
      if (!p.display_name.trim()) throw new Error('display_name required')
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({ game_id: gameId })
      .select('id')
      .single()

    if (sessionError) {
      if (sessionError.code === 'PGRST116' || sessionError.code === '23503') throw new NotFoundError()
      throw new Error(sessionError.message)
    }

    const sessionId = sessionData.id

    const playerRows = players.map((p, index) => ({
      session_id: sessionId,
      display_name: p.display_name.trim(),
      order_index: index,
    }))

    const { error: playersError } = await supabase
      .from('game_session_players')
      .insert(playerRows)

    if (playersError) throw new Error(playersError.message)

    return _fetchSessionById(sessionId)
  },

  async addRound(sessionId: string, roundResults: RoundResult[]): Promise<Round> {
    const session = await _fetchSessionById(sessionId)

    if (session.status === 'finished') throw new ConflictError('SESSION_FINISHED')

    const roundNumber = session.rounds.length + 1

    const { data, error } = await supabase
      .from('game_session_rounds')
      .insert({
        session_id: sessionId,
        round_number: roundNumber,
        results: JSON.stringify(roundResults),
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)

    return RoundSchema.parse({
      ...data,
      results: typeof data.results === 'string' ? JSON.parse(data.results) : data.results,
    })
  },

  async end(sessionId: string): Promise<GameSession> {
    const session = await _fetchSessionById(sessionId)

    if (session.status === 'finished') throw new ConflictError('SESSION_FINISHED')

    const finalScores = computeFinalScores(session.players, session.rounds)

    if (finalScores.length > 0) {
      const finalScoreRows = finalScores.map(fs => ({
        session_id: sessionId,
        player_id: fs.player_id,
        display_name: fs.display_name,
        total: fs.total,
        rank: fs.rank,
      }))

      const { error: scoresError } = await supabase
        .from('game_session_final_scores')
        .insert(finalScoreRows)

      if (scoresError) throw new Error(scoresError.message)
    }

    const { error: updateError } = await supabase
      .from('game_sessions')
      .update({ status: 'finished', ended_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (updateError) throw new Error(updateError.message)

    const { error: userGameError } = await supabase
      .from('user_games')
      .update({ last_played_at: new Date().toISOString() })
      .eq('user_id', session.user_id)
      .eq('game_id', session.game_id)

    if (userGameError) throw new Error(userGameError.message)

    return _fetchSessionById(sessionId)
  },

  async getHistory(userId: string, gameId?: string): Promise<GameSessionListItem[]> {
    let query = supabase
      .from('game_sessions')
      .select(`
        *,
        game_session_players(*),
        game_session_rounds(id, session_id, round_number, created_at),
        game_session_final_scores(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (gameId) {
      query = query.eq('game_id', gameId)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)

    return (data ?? []).map(row =>
      GameSessionListItemSchema.parse({
        ...row,
        players: row.game_session_players ?? [],
        rounds: row.game_session_rounds ?? [],
        final_scores: row.game_session_final_scores?.length ? row.game_session_final_scores : null,
      })
    )
  },

  async getById(sessionId: string): Promise<GameSession> {
    return _fetchSessionById(sessionId)
  },
}
