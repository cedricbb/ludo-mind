import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import { UpdateProfileSchema, UserSchema, User, UpdateProfileInput } from '../lib/schemas'
import { NetworkError } from '../lib/errors'

const CACHE_KEY = 'ludo_profile_cache'

export const ProfileService = {
  async getMe(): Promise<User> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').single()

      if (error) throw new NetworkError()

      const user = UserSchema.parse(data)
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(user))
      return user
    } catch (err) {
      if (err instanceof NetworkError || (err as NodeJS.ErrnoException)?.code === 'NETWORK_ERROR') {
        const cached = await AsyncStorage.getItem(CACHE_KEY)
        if (cached) return UserSchema.parse(JSON.parse(cached))
        throw err
      }
      const cached = await AsyncStorage.getItem(CACHE_KEY)
      if (cached) return UserSchema.parse(JSON.parse(cached))
      throw err
    }
  },

  async update(patch: UpdateProfileInput): Promise<User> {
    const validated = UpdateProfileSchema.parse(patch)

    const { data, error } = await supabase
      .from('profiles')
      .update(validated)
      .select('*')
      .single()

    if (error) throw error

    const user = UserSchema.parse(data)
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(user))
    return user
  },
}
