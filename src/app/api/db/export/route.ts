import { runService } from '@/lib/server/handle-service';
import { exportDb } from '@/lib/server/services/db.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  return runService(() => exportDb());
}
