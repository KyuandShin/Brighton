'use client';

import { createAuthClient } from '@neondatabase/auth/next';

export const authClient = createAuthClient({
  refreshInterval: 0,
  autoRefreshToken: false,
  retry: {
    maxRetries: 0,
    retryDelay: 0
  }
});
