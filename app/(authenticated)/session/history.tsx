import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { SessionService } from '@/services/SessionService'
import { queryKeys } from '@/lib/queryKeys'
import { DS } from '@/lib/tokens'

type Tab = 'collection' | 'history'

export default function HistoryScreen() {
  const { session: authSession } = useSession()
  const userId = authSession?.user.id ?? ''
  const [filterGameId, setFilterGameId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('history')

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: queryKeys.sessionHistory(userId, filterGameId ?? undefined),
    queryFn: () => SessionService.getHistory(userId, filterGameId ?? undefined),
    enabled: !!userId,
    staleTime: 300_000,
  })

  function handleTabPress(tab: Tab) {
    if (tab === 'collection') {
      router.replace('/library' as any)
    } else {
      setActiveTab(tab)
    }
  }

  return (
    <View testID="history-screen" style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          testID="tab-collection"
          style={[styles.tab, activeTab === 'collection' && styles.tabActive]}
          onPress={() => handleTabPress('collection')}
        >
          <Text style={[styles.tabText, activeTab === 'collection' && styles.tabTextActive]}>
            Collection
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="tab-history"
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => handleTabPress('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={DS.primary} />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No play history yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {sessions.map(session => (
            <TouchableOpacity
              key={session.id}
              testID={`session-card-${session.id}`}
              style={styles.sessionCard}
              onPress={() => router.push(`/session/${session.id}/end` as any)}
            >
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionId} numberOfLines={1}>
                  Session · {session.rounds.length} rounds
                </Text>
                <Text style={styles.sessionDate}>
                  {new Date(session.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.statusBadge, session.status === 'finished' ? styles.statusFinished : styles.statusActive]}>
                {session.status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: DS.surfaceContainerHighest },
  tabText: { color: DS.onSurfaceVariant, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: DS.secondary },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: DS.onSurfaceVariant, fontSize: 16 },
  scroll: { padding: 16, gap: 10 },
  sessionCard: {
    backgroundColor: DS.surfaceContainerHigh,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionInfo: { flex: 1 },
  sessionId: { color: DS.onSurface, fontSize: 14, fontWeight: '500' },
  sessionDate: { color: DS.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusFinished: { backgroundColor: DS.surfaceContainerHighest, color: DS.onSurfaceVariant },
  statusActive: { backgroundColor: DS.primaryContainer, color: DS.onSurface },
})
