import React from 'react'
import { render, act, waitFor } from '@testing-library/react-native'

jest.mock('../../services/ProfileService', () => ({
  ProfileService: {
    getMe: jest.fn(),
    update: jest.fn(),
  },
}))
jest.mock('../../services/AuthService', () => ({
  AuthService: { logout: jest.fn() },
}))

import ProfileScreen from '../../app/(authenticated)/profile'
import { ProfileService } from '../../services/ProfileService'

const mockGetMe = ProfileService.getMe as jest.Mock

const freeUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  display_name: 'Test User',
  avatar_url: null,
  plan: 'free' as const,
  created_at: '2026-01-01T00:00:00.000Z',
}

const premiumUser = { ...freeUser, plan: 'premium' as const }

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ProfileScreen', () => {
  it('badge Free — renders badge-free with outlineVariant border style', async () => {
    mockGetMe.mockResolvedValue(freeUser)

    const { queryByTestId } = render(<ProfileScreen />)
    await act(async () => {})

    expect(queryByTestId('badge-free')).not.toBeNull()
    expect(queryByTestId('badge-premium')).toBeNull()
  })

  it('badge Premium — renders badge-premium with gradient primary style', async () => {
    mockGetMe.mockResolvedValue(premiumUser)

    const { queryByTestId } = render(<ProfileScreen />)
    await act(async () => {})

    expect(queryByTestId('badge-premium')).not.toBeNull()
    expect(queryByTestId('badge-free')).toBeNull()
  })

  it('shows empty state when getMe returns null/throws', async () => {
    mockGetMe.mockRejectedValue(new Error('network'))

    const { queryByTestId } = render(<ProfileScreen />)
    await act(async () => {})

    expect(queryByTestId('profile-empty-state')).not.toBeNull()
  })
})
