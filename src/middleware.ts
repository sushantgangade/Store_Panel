import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    const isAuthPage = pathname.startsWith('/login');
    const isProtected =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/products');

    if (isProtected && !isLoggedIn) {
        const url = new URL('/login', req.nextUrl.origin);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};