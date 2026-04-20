seed-catalog:
	npx ts-node scripts/seed-bgg.ts

sync-catalog:
	npx ts-node scripts/sync-bgg.ts

test:
	npx jest --no-coverage
