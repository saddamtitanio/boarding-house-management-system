import { visitorService } from '@repo/api-utils/visitor'
import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { visit_id } = await req.json()

  if (!visit_id) {
    return NextResponse.json({ error: 'visit_id is required' }, { status: 400 })
  }

  try {
    const data = await visitorService.checkOut(adminSupabase, visit_id)
    return NextResponse.json(data)
  } catch (e: any) {
    const status = e.message === 'ALREADY_CHECKED_OUT' ? 409 : 500
    return NextResponse.json({ error: e.message }, { status })
  }
}