seed-catalog:
	npx tsx scripts/seed-bgg.ts

sync-catalog:
	npx tsx scripts/sync-bgg.ts

test:
	npx jest --no-coverage
