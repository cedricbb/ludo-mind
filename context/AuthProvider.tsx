import React, { createContext, useContext } from 'react'
import { useSession } from '../hooks/useSession'
import { Session } from '../lib/schemas'

interface AuthContextValue {
  session: Session | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({ session: null, isLoading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession()
  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
