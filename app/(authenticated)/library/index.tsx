import React, { useState } from 'react'
import { View, ScrollView, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useLibrary } from '../../../hooks/useLibrary'
import { FeaturedGameCard } from '../../../components/library/FeaturedGameCard'
import { StandardGameCard } from '../../../components/library/StandardGameCard'
import { GhostAddCard } from '../../../components/library/GhostAddCard'
import { DS } from '../../../lib/tokens'

type Tab = 'collection' | 'history'

export default function LibraryScreen() {
  const { games, isLoading } = useLibrary()
  const [activeTab, setActiveTab] = useState<Tab>('collection')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = searchQuery
    ? games.filter(g => g.game.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : games

  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          testID="tab-collection"
          onPress={() => setActiveTab('collection')}
          style={[styles.tab, activeTab === 'collection' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'collection' && styles.tabTextActive]}>
            Collection
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="tab-history"
          onPress={() => setActiveTab('history')}
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'history' ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No play history yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <TextInput
            testID="library-search"
            style={styles.input}
            placeholder="Filter collection..."
            placeholderTextColor={DS.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {featured && (
            <FeaturedGameCard
              userGame={featured}
              onLogPlay={() => {}}
              style={styles.featured}
            />
          )}

          <View style={styles.grid}>
            {rest.map(ug => (
              <View key={ug.id} style={styles.gridItem}>
                <StandardGameCard
                  userGame={ug}
                  onPress={id => router.push(`/library/${id}` as any)}
                />
              </View>
            ))}
            <View style={styles.gridItem}>
              <GhostAddCard onPress={() => router.push('/library/search')} />
            </View>
          </View>

          {games.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Your vault is empty</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: DS.primary },
  tabText: { color: DS.onSurfaceVariant, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: DS.primary },
  scroll: { padding: 16, gap: 12 },
  input: {
    backgroundColor: DS.surfaceContainerHigh, color: DS.onSurface,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 4,
  },
  featured: { marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { marginTop: 24, alignItems: 'center' },
  emptyText: { color: DS.onSurfaceVariant, fontSize: 16 },
})
