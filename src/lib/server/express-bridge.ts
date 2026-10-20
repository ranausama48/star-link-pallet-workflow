import { EventEmitter } from 'node:events';
import { createRequest, createResponse } from 'node-mocks-http';
import type { Request, Response } from 'express';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiApp } from '@/lib/server/api-app';

export async function forwardRequestToExpress(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  let body: unknown = undefined;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const text = await request.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
  }

  const req = createRequest({
    method: request.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD',
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers.entries()),
    body: body as Record<string, unknown> | undefined,
  }) as Request;

  const res = createResponse({ eventEmitter: EventEmitter }) as Response;

  const app = getApiApp();

  await new Promise<void>((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('close', () => resolve());
    app(req, res, (err: unknown) => {
      if (err) reject(err);
    });
  });

  const data = (res as unknown as { _getData: () => string })._getData();
  const contentType = res.getHeader('content-type')?.toString() ?? 'application/json; charset=utf-8';

  return new NextResponse(data, {
    status: res.statusCode || 200,
    headers: { 'Content-Type': contentType },
  });
}
