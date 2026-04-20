import React from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useActiveSession } from '@/hooks/useActiveSession'
import { GameCatalogService } from '@/services/GameCatalogService'
import { ActiveSessionCard } from '@/components/session/ActiveSessionCard'
import { OracleSuggestionBox } from '@/components/session/OracleSuggestionBox'
import { QuickActionCard } from '@/components/session/QuickActionCard'
import { RecommendedIntelCard } from '@/components/session/RecommendedIntelCard'
import { queryKeys } from '@/lib/queryKeys'
import { DS } from '@/lib/tokens'

export default function DashboardScreen() {
  const { session: authSession } = useSession()

  const { session: activeSession, isLoading: isLoadingSession } = useActiveSession()

  const { data: recommendedGames = [] } = useQuery({
    queryKey: queryKeys.games(''),
    queryFn: () => GameCatalogService.search(''),
    staleTime: 300_000,
  })

  const { data: activeGame } = useQuery({
    queryKey: queryKeys.gameDetail(activeSession?.game_id ?? ''),
    queryFn: () => GameCatalogService.getById(activeSession!.game_id),
    enabled: !!activeSession,
    staleTime: 300_000,
  })

  const top3 = recommendedGames.slice(0, 3)
  const badgeVariants = ['tertiary', 'secondary', 'primary'] as const

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        Welcome back{authSession?.user.display_name ? `, ${authSession.user.display_name}` : ''}
      </Text>

      {/* Active Session Area */}
      <View testID="active-session-area" style={styles.sessionArea}>
        {isLoadingSession ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={DS.primary} />
          </View>
        ) : activeSession && activeGame ? (
          <>
            <ActiveSessionCard
              testID="active-session-card"
              session={activeSession}
              game={activeGame}
              oracleSuggestion={null}
              onResume={() => router.push(`/session/${activeSession.id}/play` as any)}
              onHistory={() => router.push('/session/history' as any)}
            />
            <OracleSuggestionBox
              testID="oracle-suggestion-box"
              suggestion="Consider your next move carefully."
              gameId={activeSession.game_id}
            />
          </>
        ) : (
          <TouchableOpacity
            testID="start-new-game-card"
            style={styles.newGameCard}
            onPress={() => router.push('/session/new' as any)}
          >
            <Text style={styles.newGameText}>Start a New Game</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <QuickActionCard
          testID="quick-action-ask-rule"
          icon="auto_awesome"
          label="Ask Rule"
          variant="primary"
          onPress={() => router.push(`/oracle/${activeSession?.game_id ?? 'default'}` as any)}
        />
        <QuickActionCard
          testID="quick-action-scan-score"
          icon="photo_camera"
          label="Scan Score"
          variant="secondary"
          onPress={() => router.push(`/scan/${activeSession?.game_id ?? 'default'}` as any)}
        />
      </View>

      {/* Recommended Intel */}
      {top3.length > 0 && (
        <View style={styles.recommended}>
          <View style={styles.recommendedHeader}>
            <Text style={styles.sectionTitle}>Recommended Intel</Text>
            <TouchableOpacity testID="view-all-button" onPress={() => router.push('/library' as any)}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {top3.map((game, index) => (
            <RecommendedIntelCard
              key={game.id}
              testID={`recommended-intel-card-${index}`}
              game={game}
              badgeVariant={badgeVariants[index] ?? 'primary'}
              onPress={gameId => router.push(`/library/${gameId}` as any)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background },
  content: { padding: 16, gap: 16 },
  greeting: {
    color: DS.onSurface,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sessionArea: { gap: 12 },
  loadingBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.surfaceContainerLow,
    borderRadius: 24,
  },
  newGameCard: {
    backgroundColor: DS.surfaceContainerHigh,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  newGameText: {
    color: DS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    height: 80,
  },
  recommended: { gap: 10 },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: DS.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  viewAll: {
    color: DS.primary,
    fontSize: 14,
  },
})
