import { XMLParser } from 'fast-xml-parser'
import { BggSearchResult, BggGameDetail } from './types'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string) => ['item', 'name', 'link', 'rank'].includes(name),
})

export const BggXmlParser = {
  parseSearch(xml: string): BggSearchResult[] {
    try {
      const parsed = parser.parse(xml)
      const items: any[] = parsed?.items?.item ?? []
      return items
        .filter((item: any) => item['@_type'] === 'boardgame')
        .map((item: any) => {
          const names: any[] = item.name ?? []
          const primary = names.find((n: any) => n['@_type'] === 'primary')
          return {
            bggId: parseInt(item['@_id'], 10),
            title: primary?.['@_value'] ?? '',
          }
        })
        .filter((r: BggSearchResult) => !isNaN(r.bggId))
    } catch {
      return []
    }
  },

  parseThingBatch(xml: string): BggGameDetail[] {
    try {
      const parsed = parser.parse(xml)
      const items: any[] = parsed?.items?.item ?? []
      const results: BggGameDetail[] = []

      for (const item of items) {
        try {
          const bggId = parseInt(item['@_id'], 10)
          if (isNaN(bggId)) continue

          const names: any[] = item.name ?? []
          const primary = names.find((n: any) => n['@_type'] === 'primary')
          const title = primary?.['@_value'] ?? ''

          const links: any[] = item.link ?? []
          const publishers = links.filter((l: any) => l['@_type'] === 'boardgamepublisher')
          const publisher = publishers[0]?.['@_value'] ?? ''

          const mechanics = links
            .filter((l: any) => l['@_type'] === 'boardgamemechanic')
            .map((l: any) => l['@_value'] as string)

          const minPlayers = parseInt(item.minplayers?.['@_value'] ?? '0', 10)
          const maxPlayers = parseInt(item.maxplayers?.['@_value'] ?? '0', 10)
          const coverUrl = item.thumbnail ?? ''

          const avgVal = item.statistics?.ratings?.average?.['@_value']
          const rating = parseFloat(avgVal ?? '0') || 0

          const ranks: any[] = item.statistics?.ratings?.ranks?.rank ?? []
          const rankEl = ranks.find((r: any) => r['@_name'] === 'boardgame')
          const rankVal = rankEl?.['@_value']
          const rank = (rankVal === undefined || rankVal === 'Not Ranked')
            ? null
            : parseInt(rankVal, 10)

          results.push({ bggId, title, publisher, minPlayers, maxPlayers, coverUrl, mechanics, rating, rank })
        } catch {
          // skip malformed items
        }
      }
      return results
    } catch {
      return []
    }
  },

  parseHot(xml: string): BggSearchResult[] {
    try {
      const parsed = parser.parse(xml)
      const items: any[] = parsed?.items?.item ?? []
      return items
        .filter((item: any) => item['@_rank'] !== undefined)
        .map((item: any) => {
          const nameEl = Array.isArray(item.name) ? item.name[0] : item.name
          return {
            bggId: parseInt(item['@_id'], 10),
            title: nameEl?.['@_value'] ?? '',
          }
        })
        .filter((r: BggSearchResult) => !isNaN(r.bggId))
    } catch {
      return []
    }
  },
}
