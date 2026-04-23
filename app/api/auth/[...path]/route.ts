import { auth } from '@/lib/auth/server';
import { NextRequest } from 'next/server';

const handlers = auth.handler();

const logHandler = (method: string, handler: any) => async (req: NextRequest, props: any) => {
  // In Next.js 15, params must be awaited
  const params = await props.params;
  console.log(`[Auth API] ${method} called`, { params });
  
  try {
    const res = await handler(req, { params });
    console.log(`[Auth API] ${method} response: ${res.status}`);
    return res;
  } catch (err) {
    console.error(`[Auth API] ${method} error:`, err);
    throw err;
  }
};

export const GET = logHandler('GET', handlers.GET);
export const POST = logHandler('POST', handlers.POST);
export const PUT = logHandler('PUT', handlers.PUT);
export const PATCH = logHandler('PATCH', handlers.PATCH);
export const DELETE = logHandler('DELETE', handlers.DELETE);