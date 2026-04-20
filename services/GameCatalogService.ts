import { supabase } from '@/lib/supabase'
import { GameSchema, Game } from '@/lib/schemas'
import { NotFoundError } from '@/lib/errors'

export const GameCatalogService = {
  async search(query: string): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .ilike('title', `%${query}%`)

    if (error) throw new Error(error.message)
    return (data ?? []).map(g => GameSchema.parse(g))
  },

  async getById(gameId: string): Promise<Game> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) throw new NotFoundError()
    return GameSchema.parse(data[0])
  },
}
