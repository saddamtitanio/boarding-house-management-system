import { createClient } from '@/src/app/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { visit_id } = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('visitor_logs')
    .update({ check_out_at: new Date().toISOString() })
    .eq('id', visit_id)
    .is('check_out_at', null) // prevent double checkout
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Check out failed or already checked out' }, { status: 400 })
  }

  // notify tenant
  await supabase.from('notifications').insert({
    user_id: data.tenant_id,
    content: `${data.visitor_name} has checked out.`,
    type: 'visitor',
  })

  return NextResponse.json(data)
}