import { NextRequest, NextResponse } from "next/server";
import { neonAuthMiddleware } from "@neondatabase/auth/next/server";

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

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
