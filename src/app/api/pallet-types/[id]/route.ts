import { parseJsonBody } from '@/lib/server/http';
import { runService } from '@/lib/server/handle-service';
import { deletePalletType, updatePalletType } from '@/lib/server/services/master-data.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Ctx) {
  const { id } = await context.params;
  const body = await parseJsonBody(request);
  return runService(() => updatePalletType(id, body));
}

export async function DELETE(_request: Request, context: Ctx) {
  const { id } = await context.params;
  return runService(() => deletePalletType(id));
}
