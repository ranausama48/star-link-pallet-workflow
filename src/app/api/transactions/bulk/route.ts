import { parseJsonBody } from '@/lib/server/http';
import { runService } from '@/lib/server/handle-service';
import { bulkCreateTransactions } from '@/lib/server/services/transactions.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  return runService(() => bulkCreateTransactions(body));
}
