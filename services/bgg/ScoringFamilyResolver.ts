import { ScoringFamily, ScoringFamilyMapping } from './types'

export const ScoringFamilyResolver = {
  resolve(mechanics: string[]): ScoringFamily {
    for (const mapping of ScoringFamilyMapping) {
      if (mechanics.includes(mapping.mechanic)) {
        return mapping.family
      }
    }
    return 'custom'
  },
}
