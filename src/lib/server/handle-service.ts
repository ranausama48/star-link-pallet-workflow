import { NextResponse } from 'next/server';
import type { ServiceResponse } from '@/lib/server/route-config';

export function serviceResponse(result: ServiceResponse) {
  return NextResponse.json(result.body, { status: result.status });
}

export async function runService(fn: () => Promise<ServiceResponse>) {
  try {
    return serviceResponse(await fn());
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
