import { NextResponse } from 'next/server';
import { getBootstrapPayload } from '@/lib/server/bootstrap-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const payload = await getBootstrapPayload();
    return NextResponse.json(payload);
  } catch (err) {
    console.error('bootstrap failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load application data' },
      { status: 500 }
    );
  }
}
