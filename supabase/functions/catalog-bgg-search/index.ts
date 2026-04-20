// Deno runtime — Supabase Edge Function
// GET /catalog/bgg-search?q=<query>&limit=<n=10>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { XMLParser } from 'npm:fast-xml-parser'

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2'
const INTERNAL_TIMEOUT_MS = 8000

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string) => ['item', 'name', 'link', 'rank'].includes(name),
})

function parseBggSearchXml(xml: string): number[] {
  try {
    const parsed = xmlParser.parse(xml)
    const items: any[] = parsed?.items?.item ?? []
    return items
      .filter((i: any) => i['@_type'] === 'boardgame')
      .map((i: any) => parseInt(i['@_id'], 10))
      .filter((n: number) => !isNaN(n))
  } catch {
    return []
  }
}

function parseBggThingXml(xml: string): any[] {
  try {
    const parsed = xmlParser.parse(xml)
    const items: any[] = parsed?.items?.item ?? []
    return items.map((item: any) => {
      const names: any[] = item.name ?? []
      const primary = names.find((n: any) => n['@_type'] === 'primary')
      const links: any[] = item.link ?? []
      const publishers = links.filter((l: any) => l['@_type'] === 'boardgamepublisher')
      const mechanics = links
        .filter((l: any) => l['@_type'] === 'boardgamemechanic')
        .map((l: any) => l['@_value'])
      return {
        bgg_id: parseInt(item['@_id'], 10),
        title: primary?.['@_value'] ?? '',
        publisher: publishers[0]?.['@_value'] ?? '',
        min_players: parseInt(item.minplayers?.['@_value'] ?? '0', 10),
        max_players: parseInt(item.maxplayers?.['@_value'] ?? '0', 10),
        cover_url: item.thumbnail ?? null,
        bgg_rating: parseFloat(item.statistics?.ratings?.average?.['@_value'] ?? '0') || null,
        bgg_rank: (() => {
          const ranks: any[] = item.statistics?.ratings?.ranks?.rank ?? []
          const r = ranks.find((rk: any) => rk['@_name'] === 'boardgame')
          const v = r?.['@_value']
          return (v === undefined || v === 'Not Ranked') ? null : parseInt(v, 10)
        })(),
        mechanics,
      }
    })
  } catch {
    return []
  }
}

async function bggFetch(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`BGG HTTP ${response.status}`)
  return response.text()
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') ?? ''
  const limitParam = parseInt(url.searchParams.get('limit') ?? '10', 10)

  if (!q || q.length < 1) {
    return new Response(JSON.stringify({ error: 'q parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const limit = Math.min(Math.max(1, isNaN(limitParam) ? 10 : limitParam), 20)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const client = createClient(supabaseUrl, supabaseKey)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), INTERNAL_TIMEOUT_MS)

  try {
    // Search BGG
    const searchXml = await bggFetch(
      `${BGG_API_BASE}/search?query=${encodeURIComponent(q)}&type=boardgame`,
      controller.signal,
    )
    const bggIds = parseBggSearchXml(searchXml).slice(0, limit)

    if (bggIds.length === 0) {
      clearTimeout(timeoutId)
      return new Response(JSON.stringify({ games: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch details
    const thingXml = await bggFetch(
      `${BGG_API_BASE}/thing?id=${bggIds.join(',')}&type=boardgame&stats=1`,
      controller.signal,
    )
    clearTimeout(timeoutId)

    const gameDetails = parseBggThingXml(thingXml)

    // Upsert to Supabase
    if (gameDetails.length > 0) {
      const payload = gameDetails.map(d => ({
        bgg_id: d.bgg_id,
        title: d.title,
        publisher: d.publisher,
        min_players: d.min_players,
        max_players: d.max_players,
        cover_url: d.cover_url,
        bgg_rating: d.bgg_rating,
        bgg_rank: d.bgg_rank,
        scoring_family: 'custom',
        category: 'boardgame',
        description: null,
        rules_indexed: false,
      }))
      await client.from('games').upsert(payload, { onConflict: 'bgg_id', ignoreDuplicates: false })
    }

    // Fetch stored games
    const { data: games, error } = await client
      .from('games')
      .select('*')
      .in('bgg_id', bggIds)

    if (error) throw new Error(error.message)

    return new Response(JSON.stringify({ games: games ?? [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    clearTimeout(timeoutId)

    // Timeout fallback: return local results
    if (err.name === 'AbortError') {
      const { data: localGames } = await client
        .from('games')
        .select('*')
        .ilike('title', `%${q}%`)
        .limit(limit)
      return new Response(JSON.stringify({ games: localGames ?? [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: err.message ?? 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
