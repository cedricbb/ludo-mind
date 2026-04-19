export const queryKeys = {
  library: (userId: string) => ['library', userId] as const,
  games: (search: string) => ['games', 'search', search] as const,
  gameDetail: (gameId: string) => ['games', gameId] as const,
}
