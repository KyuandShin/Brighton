import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
    console.log(`[Middleware DEBUG] Request: ${request.method} ${request.nextUrl.pathname}`);
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
    ],
};
