import { updateSession } from '@/src/app/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {

  // updateSession handles sessi refresh and returns claims
  const { response, claims } = await updateSession(request)
  
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
      || request.nextUrl.pathname.startsWith('/auth')

    if (!claims && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (claims) {
      const role = claims?.app_metadata?.role
      if (!['admin', 'employee'].includes(role ?? '') && !isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
    }

    return response
}

export const config = {
   matcher: [
    '/((?!login|register|api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}