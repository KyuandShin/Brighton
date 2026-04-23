import { NextRequest, NextResponse } from "next/server";
import { neonAuthMiddleware } from "@neondatabase/auth/next/server";

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    console.log(`[Middleware] Request: ${request.method} ${pathname}`);

    // 1. Allow public access to /login, /signup, and landing page /
    if (
        pathname === "/" || 
        pathname.startsWith("/login") || 
        pathname.startsWith("/signup") ||
        pathname.startsWith("/api/auth") || // Important for auth routes
        pathname.startsWith("/_next") || // Important for static files
        pathname.includes(".") // For images/favicon
    ) {
        return NextResponse.next();
    }

    // 2. Protect all other routes (like /dashboard)
    return neonAuthMiddleware({ loginUrl: '/login' })(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
