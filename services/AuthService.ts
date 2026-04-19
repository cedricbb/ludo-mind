import * as SecureStore from 'expo-secure-store'
import { supabase } from '../lib/supabase'
import { RegisterRequestSchema, LoginRequestSchema, UserSchema, SessionSchema, User, Session } from '../lib/schemas'
import { ConflictError, AuthError } from '../lib/errors'

const SESSION_KEY = 'ludo_session'

export const AuthService = {
  async register(email: string, password: string): Promise<User> {
    RegisterRequestSchema.parse({ email, password })

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      if (error.message?.toLowerCase().includes('already registered') || error.status === 409) {
        throw new ConflictError()
      }
      throw error
    }

    const authUser = data.user
    if (!authUser) throw new ConflictError()

    const profile: User = {
      id: authUser.id,
      email: authUser.email!,
      display_name: email.split('@')[0],
      avatar_url: null,
      plan: 'free',
      created_at: authUser.created_at,
    }

    await supabase.from('profiles').insert(profile)

    return UserSchema.parse(profile)
  },

  async login(email: string, password: string): Promise<Session> {
    LoginRequestSchema.parse({ email, password })

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session || !data.user) {
      throw new AuthError()
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    const user: User = UserSchema.parse(
      profileData ?? {
        id: data.user.id,
        email: data.user.email,
        display_name: data.user.email!.split('@')[0],
        avatar_url: null,
        plan: 'free',
        created_at: data.user.created_at,
      }
    )

    const session: Session = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user,
    }

    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session))

    return SessionSchema.parse(session)
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY)
    await supabase.auth.signOut()
  },
}
