import { supabase } from '@/lib/supabase'
import { BggGameDetail, BggGameDetailSchema, SeedReport } from './types'
import { ScoringFamilyResolver } from './ScoringFamilyResolver'
import { BggApiClient } from './BggApiClient'

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function mergeReports(a: SeedReport, b: SeedReport): SeedReport {
  return {
    total: a.total + b.total,
    inserted: a.inserted + b.inserted,
    skipped: a.skipped + b.skipped,
    errors: [...a.errors, ...b.errors],
  }
}

export const CatalogImporter = {
  async importBatch(details: BggGameDetail[]): Promise<SeedReport> {
    const report: SeedReport = { total: details.length, inserted: 0, skipped: 0, errors: [] }

    // 1. Validate each detail
    const validDetails: BggGameDetail[] = []
    for (const detail of details) {
      const result = BggGameDetailSchema.safeParse(detail)
      if (!result.success) {
        report.skipped++
        report.errors.push({ bggId: detail.bggId, reason: result.error.message })
        continue
      }
      validDetails.push(detail)
    }

    if (validDetails.length === 0) return report

    // 2. Fetch protected bgg_ids (rules_indexed = true)
    const inputBggIds = validDetails.map(d => d.bggId)
    const { data: protectedRows } = await supabase
      .from('games')
      .select('bgg_id')
      .in('bgg_id', inputBggIds)
      .eq('rules_indexed', true)

    const protectedIds = new Set<number>((protectedRows ?? []).map((r: any) => r.bgg_id))

    const nonProtected = validDetails.filter(d => !protectedIds.has(d.bggId))
    const protected_ = validDetails.filter(d => protectedIds.has(d.bggId))

    // 3a. Pass A: full upsert for non-protected
    if (nonProtected.length > 0) {
      const payloadA = nonProtected.map(d => ({
        bgg_id: d.bggId,
        title: d.title,
        publisher: d.publisher,
        cover_url: d.coverUrl || null,
        bgg_rating: d.rating,
        bgg_rank: d.rank,
        min_players: d.minPlayers,
        max_players: d.maxPlayers,
        scoring_family: ScoringFamilyResolver.resolve(d.mechanics),
        description: null,
        category: 'boardgame',
        rules_indexed: false,
      }))
      const { error } = await supabase
        .from('games')
        .upsert(payloadA, { onConflict: 'bgg_id', ignoreDuplicates: false })
      if (error) {
        for (const d of nonProtected) {
          report.skipped++
          report.errors.push({ bggId: d.bggId, reason: error.message })
        }
      } else {
        report.inserted += nonProtected.length
      }
    }

    // 3b. Pass B: metadata-only upsert for protected
    if (protected_.length > 0) {
      const payloadB = protected_.map(d => ({
        bgg_id: d.bggId,
        title: d.title,
        publisher: d.publisher,
        cover_url: d.coverUrl || null,
        bgg_rating: d.rating,
        bgg_rank: d.rank,
      }))
      const { error } = await supabase
        .from('games')
        .upsert(payloadB, { onConflict: 'bgg_id', ignoreDuplicates: false })
      if (error) {
        for (const d of protected_) {
          report.skipped++
          report.errors.push({ bggId: d.bggId, reason: error.message })
        }
      } else {
        report.inserted += protected_.length
      }
    }

    return report
  },

  async runSeed(limit: number = 200): Promise<SeedReport> {
    const hot = await BggApiClient.fetchHot()
    const bggIds = hot.slice(0, limit).map(r => r.bggId)
    const chunks = chunk(bggIds, 20)

    let combined: SeedReport = { total: 0, inserted: 0, skipped: 0, errors: [] }

    for (const c of chunks) {
      const details = await BggApiClient.fetchDetails(c)
      await sleep(2000)
      const report = await CatalogImporter.importBatch(details)
      combined = mergeReports(combined, report)
    }

    return combined
  },

  async syncMetadata(gameIds: string[]): Promise<SeedReport> {
    const bggIds = gameIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n))
    const chunks = chunk(bggIds, 20)

    let combined: SeedReport = { total: 0, inserted: 0, skipped: 0, errors: [] }

    for (const c of chunks) {
      const details = await BggApiClient.fetchDetails(c)
      await sleep(2000)

      const report: SeedReport = { total: details.length, inserted: 0, skipped: 0, errors: [] }

      if (details.length > 0) {
        const payload = details.map(d => ({
          bgg_id: d.bggId,
          title: d.title,
          publisher: d.publisher,
          cover_url: d.coverUrl || null,
          bgg_rating: d.rating,
          bgg_rank: d.rank,
        }))
        const { error } = await supabase
          .from('games')
          .upsert(payload, { onConflict: 'bgg_id', ignoreDuplicates: false })
        if (error) {
          report.skipped = details.length
          for (const d of details) {
            report.errors.push({ bggId: d.bggId, reason: error.message })
          }
        } else {
          report.inserted = details.length
        }
      }

      combined = mergeReports(combined, report)
    }

    return combined
  },
}
