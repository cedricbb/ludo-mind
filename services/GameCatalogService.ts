import { supabase } from '../lib/supabase'
import { GameSchema, Game } from '../lib/schemas'

export const GameCatalogService = {
  async search(query: string): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .ilike('title', `%${query}%`)

    if (error) throw new Error(error.message)
    return (data ?? []).map(g => GameSchema.parse(g))
  },
}
