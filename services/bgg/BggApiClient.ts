import { BggSearchResult, BggGameDetail, BggRetryExhaustedError, BggHttpError } from './types'
import { BggXmlParser } from './BggXmlParser'

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2'
const FETCH_TIMEOUT_MS = 15000
const SLEEP_202_MS = 5000
const SLEEP_429_MS = 30000
const MAX_RETRIES_202 = 3
const MAX_RETRIES_429 = 2

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const logger = {
  info: (message: string, context?: object) => console.info(JSON.stringify({ level: 'info', message, ...context })),
  warn: (message: string, context?: object) => console.warn(JSON.stringify({ level: 'warn', message, ...context })),
  error: (message: string, context?: object) => console.error(JSON.stringify({ level: 'error', message, ...context })),
}

export const BggApiClient = {
  async search(query: string): Promise<BggSearchResult[]> {
    const url = `${BGG_API_BASE}/search?query=${encodeURIComponent(query)}&type=boardgame`
    const xml = await BggApiClient._fetchWithRetry(url)
    return BggXmlParser.parseSearch(xml)
  },

  async fetchDetails(bggIds: number[]): Promise<BggGameDetail[]> {
    if (bggIds.length > 20) {
      throw new Error('fetchDetails: max 20 ids per batch')
    }
    const ids = bggIds.join(',')
    const url = `${BGG_API_BASE}/thing?id=${ids}&type=boardgame&stats=1`
    const xml = await BggApiClient._fetchWithRetry(url)
    return BggXmlParser.parseThingBatch(xml)
  },

  async fetchHot(): Promise<BggSearchResult[]> {
    const url = `${BGG_API_BASE}/hot?type=boardgame`
    const xml = await BggApiClient._fetchWithRetry(url)
    return BggXmlParser.parseHot(xml)
  },

  async _fetchWithRetry(url: string, maxRetries: number = MAX_RETRIES_202): Promise<string> {
    let retries202 = 0
    let retries429 = 0

    while (true) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      try {
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (response.status === 200) {
          return await response.text()
        }

        if (response.status === 202) {
          retries202++
          if (retries202 > maxRetries) {
            throw new BggRetryExhaustedError(url, retries202)
          }
          logger.warn('BGG returned 202, retrying', { url, attempt: retries202 })
          await sleep(SLEEP_202_MS)
          continue
        }

        if (response.status === 429) {
          retries429++
          if (retries429 > MAX_RETRIES_429) {
            logger.error('BGG rate limit exhausted, skipping', { url, attempts: retries429 })
            throw new BggRetryExhaustedError(url, retries429)
          }
          logger.warn('BGG rate limited (429), backing off', { url, attempt: retries429 })
          await sleep(SLEEP_429_MS)
          continue
        }

        throw new BggHttpError(response.status, url)
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (err instanceof BggRetryExhaustedError || err instanceof BggHttpError) {
          throw err
        }
        throw err
      }
    }
  },
}
