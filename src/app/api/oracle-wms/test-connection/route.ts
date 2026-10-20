import { parseJsonBody } from '@/lib/server/http';
import { runService } from '@/lib/server/handle-service';
import { testOracleConnection } from '@/lib/server/services/oracle.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  return runService(() => testOracleConnection(body));
}
