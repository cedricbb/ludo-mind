import React from 'react'
import { render, act } from '@testing-library/react-native'

jest.mock('../../hooks/useSession')
jest.mock('expo-router')

import { useSession } from '@/hooks/useSession'
import { router } from 'expo-router'
import AuthenticatedLayout from '../../app/(authenticated)/_layout'

const mockUseSession = useSession as jest.Mock
const mockRouter = router as jest.Mocked<typeof router>

const validUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  display_name: 'Test',
  avatar_url: null,
  plan: 'free' as const,
  created_at: '2026-01-01T00:00:00.000Z',
}

const validSession = {
  access_token: 'tok',
  refresh_token: 'ref',
  user: validUser,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AuthenticatedLayout', () => {
  it('redirect — calls router.replace with /(auth)/login when session=null', async () => {
    mockUseSession.mockReturnValue({ session: null, isLoading: false })

    render(<AuthenticatedLayout />)
    await act(async () => {})

    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login')
  })

  it('does not redirect when session is valid', async () => {
    mockUseSession.mockReturnValue({ session: validSession, isLoading: false })

    render(<AuthenticatedLayout />)
    await act(async () => {})

    expect(mockRouter.replace).not.toHaveBeenCalled()
  })

  it('renders nothing while loading', () => {
    mockUseSession.mockReturnValue({ session: null, isLoading: true })
    const { toJSON } = render(<AuthenticatedLayout />)
    expect(toJSON()).toBeNull()
  })
})
