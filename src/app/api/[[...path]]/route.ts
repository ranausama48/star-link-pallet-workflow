import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { forwardRequestToExpress } from '@/lib/server/express-bridge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function getHandler(request: NextRequest) {
  return forwardRequestToExpress(request);
}

function mutationNotAllowed() {
  return NextResponse.json(
    {
      error:
        'This API mutation is handled by native Route Handlers. If you see this, the route may be missing or misconfigured.',
    },
    { status: 405 }
  );
}

export const GET = getHandler;
export const HEAD = getHandler;
export const POST = mutationNotAllowed;
export const PUT = mutationNotAllowed;
export const DELETE = mutationNotAllowed;
export const PATCH = mutationNotAllowed;
