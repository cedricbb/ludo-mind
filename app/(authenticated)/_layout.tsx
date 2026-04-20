import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { router, Slot, usePathname } from 'expo-router'
import { useSession } from '../../hooks/useSession'
import { TopAppBar } from '../../components/layout/TopAppBar'
import { BottomTabBar } from '../../components/layout/BottomTabBar'
import { DS } from '../../lib/tokens'

const TAB_ROUTES: Record<string, string> = {
  home: '/(authenticated)/profile',
  oracle: '/(authenticated)/profile',
  scanner: '/(authenticated)/profile',
  library: '/(authenticated)/library',
}

function activeKeyFromPath(pathname: string): string {
  if (pathname.startsWith('/library')) return 'library'
  return 'home'
}

export default function AuthenticatedLayout() {
  const { session, isLoading } = useSession()
  const pathname = usePathname()

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
      <BottomTabBar
        activeKey={activeKeyFromPath(pathname)}
        onPress={(key) => router.push(TAB_ROUTES[key] as any)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background },
  content: { flex: 1 },
})
