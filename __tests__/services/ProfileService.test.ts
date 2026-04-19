import { ProfileService } from '../../services/ProfileService'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))
jest.mock('@react-native-async-storage/async-storage')

import { supabase } from '../../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

const mockFrom = supabase.from as jest.Mock

const baseProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  display_name: 'Test User',
  avatar_url: null,
  plan: 'free' as const,
  created_at: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(AsyncStorage as any).__reset?.()
})

describe('ProfileService.update', () => {
  it('throws ZodError for empty display_name', async () => {
    await expect(ProfileService.update({ display_name: '' })).rejects.toThrow()
  })

  it('throws ZodError for display_name with only spaces', async () => {
    await expect(ProfileService.update({ display_name: '   ' })).rejects.toThrow()
  })

  it('throws ZodError for display_name > 50 chars', async () => {
    await expect(
      ProfileService.update({ display_name: 'a'.repeat(51) })
    ).rejects.toThrow()
  })

  it('updates profile and caches result', async () => {
    const updated = { ...baseProfile, display_name: 'New Name' }
    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: updated, error: null }),
        }),
      }),
    })

    const result = await ProfileService.update({ display_name: 'New Name' })

    expect(result.display_name).toBe('New Name')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'ludo_profile_cache',
      JSON.stringify(updated)
    )
  })
})

describe('ProfileService.getMe', () => {
  it('returns cached user when network fails', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } }),
      }),
    })
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(baseProfile))

    const user = await ProfileService.getMe()
    expect(user.email).toBe(baseProfile.email)
  })

  it('caches successful getMe result', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: baseProfile, error: null }),
      }),
    })

    await ProfileService.getMe()

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'ludo_profile_cache',
      JSON.stringify(baseProfile)
    )
  })
})
