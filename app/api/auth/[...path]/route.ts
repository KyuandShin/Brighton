import { authApiHandler } from '@neondatabase/auth/next/server';
import { NextRequest } from 'next/server';

const handlers = authApiHandler();

const logHandler = (method: string, handler: any) => async (req: NextRequest, props: any) => {
  console.log(`[Auth API] ${method} called`, props);
  try {
    const res = await handler(req, props);
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
