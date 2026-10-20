import { runService } from '@/lib/server/handle-service';
import { resetDb } from '@/lib/server/services/db.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  return runService(() => resetDb());
}
