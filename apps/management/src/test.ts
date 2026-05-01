// import { jwtDecode } from 'jwt-decode'
// import { NextRequest, NextResponse } from 'next/server'

// export async function proxy(request: NextRequest) {
//   const token = request.cookies.get('sb-access-token')?.value

//   if (!token) {
//     return NextResponse.redirect(new URL('/login', request.url))
//   }

//   const decoded = jwtDecode<{ app_metadata?: { role?: string } }>(token)
//   const role = decoded.app_metadata?.role

//   if (!['admin', 'employee'].includes(role ?? '')) {
//     return NextResponse.redirect(new URL('/unauthorized', request.url))
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: ['/((?!login|_next|favicon.ico).*)']
// }