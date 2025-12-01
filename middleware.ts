import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect dashboard and admin routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Check admin access
        if (pathname.startsWith('/admin') && payload.role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Add user info to headers for server components
        const response = NextResponse.next();
        response.headers.set('x-user-id', payload.userId as string);
        response.headers.set('x-user-role', payload.role as string);
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
};
