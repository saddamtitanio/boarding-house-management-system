import { createClient } from '@/src/app/lib/supabase/server'
import { serviceQueueService } from '@repo/api-utils/service'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await serviceQueueService.getTenantRequests(supabase, user.id)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { service_id, note } = await req.json()
  if (!service_id) return NextResponse.json({ error: 'service_id is required' }, { status: 400 })

  // Check active lease
  const { data: activeLease } = await supabase
    .from('leases')
    .select('id')
    .eq('tenant_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!activeLease) {
    return NextResponse.json({ error: 'Active lease required to request services' }, { status: 403 })
  }

  try {
    const data = await serviceQueueService.createRequest(supabase, {
      tenant_id: user.id,
      service_id,
      note,
    })
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    const status = e.message === 'SERVICE_NOT_FOUND' ? 404 : 500
    return NextResponse.json({ error: e.message }, { status })
  }
}