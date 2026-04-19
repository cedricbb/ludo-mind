import React, { memo } from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { DS } from '../../lib/tokens'

export interface Tab {
  key: string
  label: string
  testID: string
}

export const TABS: Tab[] = [
  { key: 'home', label: 'Home', testID: 'tab-home' },
  { key: 'oracle', label: 'Oracle', testID: 'tab-oracle' },
  { key: 'scanner', label: 'Scanner', testID: 'tab-scanner' },
  { key: 'library', label: 'Library', testID: 'tab-library' },
]

interface Props {
  activeKey?: string
  onPress?: (key: string) => void
}

export const BottomTabBar = memo(function BottomTabBar({ activeKey, onPress }: Props) {
  return (
    <View style={styles.container} testID="bottom-tab-bar">
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.key}
          testID={tab.testID}
          style={styles.tab}
          onPress={() => onPress?.(tab.key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab.key === activeKey }}
        >
          <Text style={[styles.label, tab.key === activeKey && styles.activeLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: DS.surfaceContainerLow,
    borderTopWidth: 0,
    height: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: DS.onSurfaceVariant,
    fontSize: 12,
  },
  activeLabel: {
    color: DS.primary,
  },
})
