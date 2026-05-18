import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_PATHS = ['/', '/login', '/signup', '/reset-password', '/verify'];

const authMiddleware = auth.middleware({ loginUrl: "/login" });

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes through without auth check
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/auth')
  ) {
    return NextResponse.next();
  }

  // All other routes (e.g. /dashboard) go through auth middleware
  return authMiddleware(req as any);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
