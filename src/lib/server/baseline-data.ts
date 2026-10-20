import fs from 'fs';
import path from 'path';
import type { WarehouseDb } from '@/lib/server/types/warehouse-db';

export function readBaselineWarehouseDb(): WarehouseDb {
  const filePath = path.join(process.cwd(), 'data', 'warehouse_db.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as WarehouseDb;
}
