import { supabase } from '../lib/supabase'
import { UserGameSchema, UserGame } from '../lib/schemas'
import { ConflictError, NotFoundError } from '../lib/errors'

export const UserLibraryService = {
  async getLibrary(userId: string): Promise<UserGame[]> {
    const { data, error } = await supabase
      .from('user_games')
      .select('*, game:games(*)')
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    return (data ?? []).map(g => UserGameSchema.parse(g))
  },

  async addGame(userId: string, gameId: string): Promise<UserGame> {
    const { data, error } = await supabase
      .from('user_games')
      .insert({ user_id: userId, game_id: gameId })
      .select('*, game:games(*)')
      .single()

    if (error) {
      if (error.code === '23505') throw new ConflictError('GAME_CONFLICT')
      throw new NotFoundError()
    }
    return UserGameSchema.parse(data)
  },

  async removeGame(userId: string, gameId: string): Promise<void> {
    const { error } = await supabase
      .from('user_games')
      .delete()
      .eq('user_id', userId)
      .eq('game_id', gameId)

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundError()
      throw new Error(error.message)
    }
  },
}
