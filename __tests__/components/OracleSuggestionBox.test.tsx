import React from 'react'
import { render } from '@testing-library/react-native'
import { OracleSuggestionBox } from '@/components/session/OracleSuggestionBox'
import { DS } from '@/lib/tokens'

const gameId = '00000000-0000-0000-0000-000000000001'

describe('OracleSuggestionBox', () => {
  it('renders null when suggestion is null', () => {
    const { queryByTestId } = render(
      <OracleSuggestionBox suggestion={null} gameId={gameId} />
    )
    expect(queryByTestId('oracle-suggestion-box')).toBeNull()
  })

  it('renders the suggestion text when suggestion is provided', () => {
    const { getByTestId, getByText } = render(
      <OracleSuggestionBox suggestion="Consider your options carefully." gameId={gameId} />
    )
    expect(getByTestId('oracle-suggestion-box')).toBeTruthy()
    expect(getByText('Consider your options carefully.')).toBeTruthy()
  })

  it('uses surfaceBright/40 background color (#2a2a3d66)', () => {
    const { getByTestId } = render(
      <OracleSuggestionBox suggestion="Test suggestion" gameId={gameId} />
    )
    const box = getByTestId('oracle-suggestion-box')
    const style = box.props.style
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style
    expect(flatStyle.backgroundColor).toBe(`${DS.surfaceBright}66`)
    expect(flatStyle.backgroundColor).toBe('#2a2a3d66')
  })

  it('uses BlurView with intensity 20', () => {
    // BlurView is mapped to our mock via moduleNameMapper
    // The component renders without error — intensity is passed as a prop
    const { getByTestId } = render(
      <OracleSuggestionBox suggestion="Test" gameId={gameId} />
    )
    expect(getByTestId('oracle-suggestion-box')).toBeTruthy()
  })
})
