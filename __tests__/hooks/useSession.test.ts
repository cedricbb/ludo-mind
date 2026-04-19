import { renderHook, act } from '@testing-library/react-native'
import { useSession } from '../../hooks/useSession'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      refreshSession: jest.fn(),
    },
  },
}))
jest.mock('expo-secure-store')

import * as SecureStore from 'expo-secure-store'
import { supabase } from '../../lib/supabase'

const mockGetItem = SecureStore.getItemAsync as jest.Mock
const mockSetItem = SecureStore.setItemAsync as jest.Mock
const mockDeleteItem = SecureStore.deleteItemAsync as jest.Mock
const mockRefresh = supabase.auth.refreshSession as jest.Mock

const validUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  display_name: 'Test',
  avatar_url: null,
  plan: 'free' as const,
  created_at: '2026-01-01T00:00:00.000Z',
}

const makeToken = (exp?: number) => {
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64')
  return `header.${payload}.sig`
}

const validSession = {
  access_token: makeToken(Math.floor(Date.now() / 1000) + 3600),
  refresh_token: 'refresh_tok',
  user: validUser,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(SecureStore as any).__reset?.()
})

describe('useSession', () => {
  it('persists session — returns non-null session from SecureStore', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(validSession))

    const { result } = renderHook(() => useSession())

    await act(async () => {})

    expect(result.current.session).not.toBeNull()
    expect(result.current.session?.user.email).toBe('test@example.com')
  })

  it('cold start — isLoading transitions to false after SecureStore read', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(validSession))

    const { result } = renderHook(() => useSession())

    expect(result.current.isLoading).toBe(true)

    await act(async () => {})

    expect(result.current.isLoading).toBe(false)
  })

  it('returns null session when SecureStore is empty', async () => {
    mockGetItem.mockResolvedValue(null)

    const { result } = renderHook(() => useSession())
    await act(async () => {})

    expect(result.current.session).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('refreshes expired token silently and updates SecureStore', async () => {
    const expiredSession = {
      ...validSession,
      access_token: makeToken(Math.floor(Date.now() / 1000) - 100),
    }
    mockGetItem.mockResolvedValue(JSON.stringify(expiredSession))

    const newAccessToken = makeToken(Math.floor(Date.now() / 1000) + 3600)
    mockRefresh.mockResolvedValue({
      data: { session: { access_token: newAccessToken, refresh_token: 'new_refresh' } },
      error: null,
    })

    const { result } = renderHook(() => useSession())
    await act(async () => {})

    expect(mockRefresh).toHaveBeenCalled()
    expect(mockSetItem).toHaveBeenCalled()
    expect(result.current.session?.access_token).toBe(newAccessToken)
  })

  it('sets session=null if refresh fails', async () => {
    const expiredSession = {
      ...validSession,
      access_token: makeToken(Math.floor(Date.now() / 1000) - 100),
    }
    mockGetItem.mockResolvedValue(JSON.stringify(expiredSession))
    mockRefresh.mockResolvedValue({ data: { session: null }, error: { message: 'refresh failed' } })

    const { result } = renderHook(() => useSession())
    await act(async () => {})

    expect(mockDeleteItem).toHaveBeenCalledWith('ludo_session')
    expect(result.current.session).toBeNull()
  })
})
