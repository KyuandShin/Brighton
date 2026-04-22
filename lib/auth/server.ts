import { createAuthServer } from '@neondatabase/auth/next/server';

// Lazy initialize auth only when actually needed at runtime
// This prevents running createAuthServer() during Next.js build phase when env vars are not available
let authInstance: ReturnType<typeof createAuthServer> | null = null;

export function getAuth() {
  if (!authInstance) {
    authInstance = createAuthServer();
  }
  return authInstance;
}

// Export auth for backward compatibility
export const auth = new Proxy({}, {
  get(target, prop) {
    return getAuth()[prop as keyof ReturnType<typeof createAuthServer>];
  }
}) as ReturnType<typeof createAuthServer>;
