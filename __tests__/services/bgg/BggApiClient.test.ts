import { BggApiClient } from '../../../services/bgg/BggApiClient'
import { BggRetryExhaustedError, BggHttpError } from '../../../services/bgg/types'

const mockFetch = jest.fn()
global.fetch = mockFetch

jest.useFakeTimers()

describe('BggApiClient._fetchWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns body text on HTTP 200', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      text: async () => '<items/>',
    })

    const result = await BggApiClient._fetchWithRetry('https://example.com/api')
    expect(result).toBe('<items/>')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('throws BggRetryExhaustedError after 3 consecutive HTTP 202', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 202, text: async () => '' })
      .mockResolvedValueOnce({ status: 202, text: async () => '' })
      .mockResolvedValueOnce({ status: 202, text: async () => '' })
      .mockResolvedValueOnce({ status: 202, text: async () => '' })

    const promise = BggApiClient._fetchWithRetry('https://example.com/api', 3)

    // advance timers for each 5000ms sleep (3 retries)
    for (let i = 0; i < 3; i++) {
      await Promise.resolve()
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    }

    await expect(promise).rejects.toThrow(BggRetryExhaustedError)
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })

  it('throws BggHttpError for non-202/429 error codes', async () => {
    mockFetch.mockResolvedValueOnce({ status: 500, text: async () => '' })

    await expect(BggApiClient._fetchWithRetry('https://example.com/api')).rejects.toThrow(BggHttpError)
  })

  it('throws BggRetryExhaustedError after 2 HTTP 429 retries', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 429, text: async () => '' })
      .mockResolvedValueOnce({ status: 429, text: async () => '' })
      .mockResolvedValueOnce({ status: 429, text: async () => '' })

    const promise = BggApiClient._fetchWithRetry('https://example.com/api')

    for (let i = 0; i < 2; i++) {
      await Promise.resolve()
      jest.advanceTimersByTime(30000)
      await Promise.resolve()
    }

    await expect(promise).rejects.toThrow(BggRetryExhaustedError)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})

describe('BggApiClient.fetchDetails', () => {
  beforeEach(() => jest.clearAllMocks())

  it('throws when more than 20 ids are passed', async () => {
    const ids = Array.from({ length: 21 }, (_, i) => i + 1)
    await expect(BggApiClient.fetchDetails(ids)).rejects.toThrow('fetchDetails: max 20 ids per batch')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls BGG /thing endpoint with joined ids', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      text: async () => '<items></items>',
    })

    await BggApiClient.fetchDetails([92415, 150145])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('92415,150145'),
      expect.any(Object),
    )
  })
})
