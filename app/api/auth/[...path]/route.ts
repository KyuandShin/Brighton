import { getAuthHandlers } from '@/lib/auth/server';

// Get properly initialized auth handlers
const handlers = getAuthHandlers();
export const { GET, POST, PUT, PATCH, DELETE } = handlers;
