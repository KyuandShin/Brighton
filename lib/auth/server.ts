import { createNeonAuth } from '@neondatabase/auth/next/server';

let authInstance: ReturnType<typeof createNeonAuth> | null = null;

export function getAuth() {
  if (!authInstance) {
    authInstance = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
      },
    });
  }
  return authInstance;
}

// Export auth for backward compatibility
export const auth = new Proxy({}, {
  get(target, prop) {
    return getAuth()[prop as keyof ReturnType<typeof createNeonAuth>];
  }
}) as ReturnType<typeof createNeonAuth>;

// Export handlers directly
export function getAuthHandlers() {
  const authServer = getAuth();
  return authServer.handler();
}
