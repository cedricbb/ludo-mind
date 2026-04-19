import React from 'react'
import { render } from '@testing-library/react-native'
import { BottomTabBar, TABS } from '../../components/layout/BottomTabBar'

describe('BottomTabBar', () => {
  it('renders 4 tabs: Home, Oracle, Scanner, Library', () => {
    const { getByTestId, getByText } = render(<BottomTabBar />)

    expect(TABS).toHaveLength(4)

    getByTestId('tab-home')
    getByTestId('tab-oracle')
    getByTestId('tab-scanner')
    getByTestId('tab-library')

    getByText('Home')
    getByText('Oracle')
    getByText('Scanner')
    getByText('Library')
  })

  it('renders bottom-tab-bar container', () => {
    const { getByTestId } = render(<BottomTabBar />)
    expect(getByTestId('bottom-tab-bar')).toBeTruthy()
  })
})
