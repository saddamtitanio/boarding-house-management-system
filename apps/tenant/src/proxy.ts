import { updateSession } from '@/src/app/lib/supabase/proxy'
import { NextResponse, type NextRequest } from 'next/server'

// these pages require auth
const AUTH_REQUIRED = [
  '/dashboard',
  '/profile',
  '/payments',
  '/notifications',
  '/visitor'
]

// API routes that are public (visitor check-in/out)
const PUBLIC_API = [
  '/api/visit/check-in',
  '/api/visit/check-out',
]

export async function proxy(request: NextRequest) {
  const { response, claims } = await updateSession(request)
  const { pathname } = request.nextUrl

  // always allow public API through
  if (PUBLIC_API.some(r => pathname.startsWith(r))) {
    return response
  }

  // redirect logged-in users away from login/register
  if (claims && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // block auth-required pages for unauthenticated users
  if (!claims && AUTH_REQUIRED.some(r => pathname.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}