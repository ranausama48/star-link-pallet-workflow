import type { NextRequest } from 'next/server';
import { forwardRequestToExpress } from '@/lib/server/express-bridge';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  return forwardRequestToExpress(request);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
