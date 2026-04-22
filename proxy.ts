import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
    const { auth } = await import("@/lib/auth/server");
    
    const { pathname } = request.nextUrl;

    // 1. Allow public access to /login, /signup, and landing page /
    if (
        pathname === "/" || 
        pathname.startsWith("/login") || 
        pathname.startsWith("/signup") ||
        pathname.startsWith("/_next") || // Important for static files
        pathname.includes(".") // For images/favicon
    ) {
        return NextResponse.next();
    }

    // 2. Protect all other routes (like /dashboard)
    return auth.middleware({ loginUrl: '/login' })(request);
}
