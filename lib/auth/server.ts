import { createAuthServer } from '@neondatabase/auth/next/server';

let authInstance: ReturnType<typeof createAuthServer> | null = null;

export function getAuth() {
  if (!authInstance) {
    authInstance = createAuthServer({
      // ✅ FIX: Disable internal recursive fetch that causes infinite loop 401 errors
      // This prevents the auth library from calling back to /api/me when getting session
      self: false,
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
    return getAuth()[prop as keyof ReturnType<typeof createAuthServer>];
  }
}) as ReturnType<typeof createAuthServer>;

// Export handlers directly
export function getAuthHandlers() {
  const authServer = getAuth();
  // The createAuthServer returns an object with handler methods
  // In this beta version, handlers might be directly on the instance
  if (typeof (authServer as any).handler === 'function') {
    return (authServer as any).handler();
  }
  // Or return the auth object itself if it has GET/POST methods
  return authServer as any;
}