import dotenv from 'dotenv';
import { readBaselineWarehouseDb } from '../src/lib/server/baseline-data';
import { saveWarehouseDb } from '../src/lib/server/warehouse-sync';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const baseline = readBaselineWarehouseDb();
  await saveWarehouseDb(baseline);
  console.log('Seeded warehouse baseline from data/warehouse_db.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
