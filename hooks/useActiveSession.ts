import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from './useSession'
import { SessionService } from '../services/SessionService'
import { queryKeys } from '../lib/queryKeys'
import { GameSession, GameSessionListItem, RoundResult, Round } from '../lib/schemas'

export function useActiveSession(): {
  session: GameSessionListItem | null
  addRound(roundResults: RoundResult[]): Promise<Round>
  endSession(): Promise<GameSession>
  isLoading: boolean
  error: Error | null
} {
  const { session: authSession } = useSession()
  const userId = authSession?.user.id ?? ''
  const queryClient = useQueryClient()

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: queryKeys.activeSession(userId),
    queryFn: () => SessionService.getHistory(userId),
    enabled: !!userId,
    staleTime: 30_000,
  })

  const activeSession = sessions.find(s => s.status === 'active') ?? null

  const addRoundMutation = useMutation({
    mutationFn: (roundResults: RoundResult[]) => {
      if (!activeSession) return Promise.reject(new Error('No active session'))
      return SessionService.addRound(activeSession.id, roundResults)
    },
    onSuccess: () => {
      if (activeSession) {
        queryClient.invalidateQueries({ queryKey: queryKeys.session(activeSession.id) })
      }
    },
  })

  const endSessionMutation = useMutation({
    mutationFn: () => {
      if (!activeSession) return Promise.reject(new Error('No active session'))
      return SessionService.end(activeSession.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeSession(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionHistory(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.library(userId) })
    },
  })

  return {
    session: activeSession,
    addRound: (roundResults: RoundResult[]) => addRoundMutation.mutateAsync(roundResults),
    endSession: () => endSessionMutation.mutateAsync(),
    isLoading,
    error: error as Error | null,
  }
}
