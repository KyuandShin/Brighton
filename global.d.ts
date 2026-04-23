declare module '*.css';
declare module '*.scss';
declare module '*.sass';

declare module '@neondatabase/auth/next' {
  export function createAuthClient(options?: {
    refreshInterval?: number;
    autoRefreshToken?: boolean;
    retry?: {
      maxRetries?: number;
      retryDelay?: number;
    };
  }): any;
}

declare module '@neondatabase/auth/react' {
  export const AuthUIProvider: any;
}

declare module '@neondatabase/auth/next/server' {
  export function authApiHandler(): any;
}
