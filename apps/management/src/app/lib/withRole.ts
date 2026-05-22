import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/src/app/lib/supabase/server'

export function withRole(allowedRoles: string[], handler: any) {
  return async (req: NextRequest, context: any) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const { data: profile, error: dbError } = await adminSupabase
      .from('profiles')
      .select(`
        role:roles (
          name
        )
      `)
      .eq('id', user.id)
      .single()

    if (dbError || !profile || !profile.role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = profile.role.name

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(req, context)
  }
}