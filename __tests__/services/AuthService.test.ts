import { AuthService } from '../../services/AuthService'
import { ConflictError, AuthError } from '../../lib/errors'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}))
jest.mock('expo-secure-store')

import { supabase } from '../../lib/supabase'
import * as SecureStore from 'expo-secure-store'

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>
const mockFrom = supabase.from as jest.Mock

const baseUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  created_at: '2026-01-01T00:00:00.000Z',
}

const baseProfile = {
  id: baseUser.id,
  email: baseUser.email,
  display_name: 'test',
  avatar_url: null,
  plan: 'free' as const,
  created_at: baseUser.created_at,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFrom.mockReturnValue({
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: baseProfile, error: null }),
      }),
    }),
  })
})

describe('AuthService.register', () => {
  it('creates account and returns user with plan=free', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { user: baseUser }, error: null } as any)

    const user = await AuthService.register('test@example.com', 'password123')

    expect(user.plan).toBe('free')
    expect(user.email).toBe('test@example.com')
    expect(user.id).toBe(baseUser.id)
  })

  it('throws ConflictError on 409 duplicate email', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered', status: 409 },
    } as any)

    await expect(AuthService.register('dup@example.com', 'password123')).rejects.toThrow(ConflictError)
  })

  it('throws ZodError if email is invalid', async () => {
    await expect(AuthService.register('not-an-email', 'password123')).rejects.toThrow()
  })

  it('throws ZodError if password < 8 chars', async () => {
    await expect(AuthService.register('test@example.com', 'short')).rejects.toThrow()
  })
})

describe('AuthService.login', () => {
  const mockSession = {
    access_token: 'access_tok',
    refresh_token: 'refresh_tok',
  }

  it('authenticates and stores session in SecureStore', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { session: mockSession, user: baseUser },
      error: null,
    } as any)

    const session = await AuthService.login('test@example.com', 'password123')

    expect(session.access_token).toBe('access_tok')
    expect(session.user.email).toBe('test@example.com')
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'ludo_session',
      expect.stringContaining('access_tok')
    )
  })

  it('throws AuthError on invalid credentials', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    } as any)

    await expect(AuthService.login('test@example.com', 'wrongpass')).rejects.toThrow(AuthError)
  })
})

describe('AuthService.logout', () => {
  it('deletes SecureStore key and calls supabase signOut', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null } as any)

    await AuthService.logout()

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ludo_session')
    expect(mockAuth.signOut).toHaveBeenCalled()
  })
})
