import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'

// potentially need to use getUser() instead of getClaims() for security 
export function withRole(allowedRoles: string[], handler: any) {
  return async (req: NextRequest, context: any) => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getClaims()

    if (!data?.claims || error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = data.claims.app_metadata?.role

    if (!allowedRoles.includes(role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(req, context)
  }
}