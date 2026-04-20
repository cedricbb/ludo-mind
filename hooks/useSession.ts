import { useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { supabase } from '../lib/supabase'
import { SessionSchema, Session } from '../lib/schemas'

const SESSION_KEY = 'ludo_session'

export function useSession(): { session: Session | null; isLoading: boolean } {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      try {
        const raw = await SecureStore.getItemAsync(SESSION_KEY)
        if (!raw) {
          if (!cancelled) setSession(null)
          return
        }

        const parsed = SessionSchema.parse(JSON.parse(raw))
        const expMs = parseJwtExp(parsed.access_token)

        if (expMs && expMs < Date.now()) {
          const { data, error } = await supabase.auth.refreshSession({ refresh_token: parsed.refresh_token })

          if (error || !data.session) {
            await SecureStore.deleteItemAsync(SESSION_KEY)
            if (!cancelled) setSession(null)
            return
          }

          const refreshed: Session = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            user: parsed.user,
          }
          await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(refreshed))
          await supabase.auth.setSession({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token,
          })
          if (!cancelled) setSession(SessionSchema.parse(refreshed))
          return
        }

        await supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        })
        if (!cancelled) setSession(parsed)
      } catch {
        if (!cancelled) setSession(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadSession()
    return () => { cancelled = true }
  }, [])

  return { session, isLoading }
}

function parseJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}
