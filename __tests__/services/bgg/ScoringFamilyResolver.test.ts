import { ScoringFamilyResolver } from '../../../services/bgg/ScoringFamilyResolver'

describe('ScoringFamilyResolver.resolve', () => {
  it('returns contract_tricks for Trick-taking', () => {
    expect(ScoringFamilyResolver.resolve(['Trick-taking'])).toBe('contract_tricks')
  })

  it('returns incremental for Tile Placement', () => {
    expect(ScoringFamilyResolver.resolve(['Tile Placement'])).toBe('incremental')
  })

  it('returns incremental for Set Collection', () => {
    expect(ScoringFamilyResolver.resolve(['Set Collection'])).toBe('incremental')
  })

  it('returns incremental for Area Majority / Influence', () => {
    expect(ScoringFamilyResolver.resolve(['Area Majority / Influence'])).toBe('incremental')
  })

  it('returns incremental for multiple incremental mechanics', () => {
    expect(ScoringFamilyResolver.resolve(['Tile Placement', 'Set Collection'])).toBe('incremental')
  })

  it('returns custom for empty mechanics', () => {
    expect(ScoringFamilyResolver.resolve([])).toBe('custom')
  })

  it('returns custom for unrecognized mechanics', () => {
    expect(ScoringFamilyResolver.resolve(['Worker Placement', 'Resource Management'])).toBe('custom')
  })

  it('prioritizes contract_tricks over incremental', () => {
    expect(ScoringFamilyResolver.resolve(['Tile Placement', 'Trick-taking'])).toBe('contract_tricks')
  })
})
