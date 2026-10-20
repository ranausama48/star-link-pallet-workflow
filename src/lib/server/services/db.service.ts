import { readBaselineWarehouseDb } from '@/lib/server/baseline-data';
import { loadWarehouseDb, saveWarehouseDb } from '@/lib/server/warehouse-sync';
import type { ServiceResponse } from '@/lib/server/route-config';

export async function exportDb(): Promise<ServiceResponse> {
  const db = await loadWarehouseDb();
  return { status: 200, body: db };
}

/** Full re-import — only mutation path that may wipe and rewrite all tables. */
export async function resetDb(): Promise<ServiceResponse> {
  const initial = readBaselineWarehouseDb();
  await saveWarehouseDb(initial);
  return {
    status: 200,
    body: { success: true, message: 'Database reset to verified warehouse baseline', db: initial },
  };
}
