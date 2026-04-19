import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from './useSession'
import { UserLibraryService } from '../services/UserLibraryService'
import { queryKeys } from '../lib/queryKeys'
import { UserGame } from '../lib/schemas'

export function useLibrary(): {
  games: UserGame[]
  isLoading: boolean
  addGame(gameId: string): Promise<void>
  removeGame(gameId: string): Promise<void>
} {
  const { session } = useSession()
  const userId = session?.user.id ?? ''
  const queryClient = useQueryClient()

  const { data: games = [], isLoading } = useQuery({
    queryKey: queryKeys.library(userId),
    queryFn: () => UserLibraryService.getLibrary(userId),
    enabled: !!userId,
    staleTime: 60_000,
  })

  const addMutation = useMutation({
    mutationFn: (gameId: string) => UserLibraryService.addGame(userId, gameId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.library(userId) }),
  })

  const removeMutation = useMutation({
    mutationFn: (gameId: string) => UserLibraryService.removeGame(userId, gameId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.library(userId) }),
  })

  return {
    games,
    isLoading,
    addGame: (gameId: string) => addMutation.mutateAsync(gameId),
    removeGame: (gameId: string) => removeMutation.mutateAsync(gameId),
  }
}
