import { CatalogImporter } from '../services/bgg/CatalogImporter'

async function main() {
  const report = await CatalogImporter.runSeed(200)
  console.log(JSON.stringify(report, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ level: 'error', message: err.message }))
  process.exit(1)
})
