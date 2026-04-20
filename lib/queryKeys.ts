export const queryKeys = {
  library: (userId: string) => ['library', userId] as const,
  games: (search: string) => ['games', 'search', search] as const,
  gameDetail: (gameId: string) => ['games', gameId] as const,
  activeSession: (userId: string) => ['sessions', 'active', userId] as const,
  session: (sessionId: string) => ['sessions', sessionId] as const,
  sessionHistory: (userId: string, gameId?: string) =>
    gameId ? ['sessions', 'history', userId, gameId] as const
           : ['sessions', 'history', userId] as const,
}
