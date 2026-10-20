import { parseJsonBody } from '@/lib/server/http';
import { runService } from '@/lib/server/handle-service';
import { updateOracleConfig } from '@/lib/server/services/oracle.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function PUT(request: Request) {
  const body = await parseJsonBody(request);
  return runService(() => updateOracleConfig(body));
}
