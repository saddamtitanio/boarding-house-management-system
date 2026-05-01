import { jwtDecode } from 'jwt-decode'
import { NextResponse } from 'next/server'

export function withRole(allowedRoles: string[], handler: any) {
  return async (req: any, context: any) => {
    const token = req.cookies.get('sb-access-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwtDecode<any>(token)
    const role = decoded?.app_metadata?.role

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(req, context)
  }
}