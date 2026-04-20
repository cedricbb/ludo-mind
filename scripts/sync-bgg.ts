import { supabase } from '../lib/supabase'
import { CatalogImporter } from '../services/bgg/CatalogImporter'

async function main() {
  const { data, error } = await supabase
    .from('games')
    .select('bgg_id')
    .not('bgg_id', 'is', null)
    .limit(200)

  if (error) {
    console.error(JSON.stringify({ level: 'error', message: error.message }))
    process.exit(1)
  }

  const gameIds: string[] = (data ?? []).map((r: any) => String(r.bgg_id))
  const report = await CatalogImporter.syncMetadata(gameIds)
  console.log(JSON.stringify(report, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ level: 'error', message: err.message }))
  process.exit(1)
})
