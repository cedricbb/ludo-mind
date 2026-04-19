import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { router, Slot } from 'expo-router'
import { useSession } from '../../hooks/useSession'
import { TopAppBar } from '../../components/layout/TopAppBar'
import { BottomTabBar } from '../../components/layout/BottomTabBar'
import { DS } from '../../lib/tokens'

export default function AuthenticatedLayout() {
  const { session, isLoading } = useSession()

  useEffect(() => {
    if (!isLoading && session === null) {
      router.replace('/(auth)/login')
    }
  }, [session, isLoading])

  if (isLoading || session === null) return null

  return (
    <View style={styles.container} testID="authenticated-layout">
      <TopAppBar user={session.user} />
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomTabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background },
  content: { flex: 1 },
})
