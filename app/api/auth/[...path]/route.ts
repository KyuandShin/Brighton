import { auth } from '@/lib/auth/server';

// @ts-expect-error - handler exports all HTTP methods in Neon Auth beta
export const { GET, POST, PUT, PATCH, DELETE } = auth;
