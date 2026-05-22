import { createClient, createAdminClient } from '@/src/app/lib/supabase/server'
import { serviceQueueService } from '@repo/api-utils/service'
import { NextResponse, type NextRequest } from 'next/server'
import { withRole } from '@/src/app/lib/withRole'

export const GET = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { id } = await params
  try {
    const data = await serviceQueueService.getRequestById(supabase, id)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
})

export const PATCH = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const { id } = await params
  const body = await req.json()

  // get current user's id and role from claims
  const { data } = await supabase.auth.getClaims()
  const requesterId = data?.claims?.sub
  const requesterRole = data?.claims?.app_metadata?.role

  if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await serviceQueueService.updateRequest(
      adminSupabase,
      id,
      { status: body.status, assigned_to: body.assigned_to },
      requesterId,
      requesterRole
    )
    return NextResponse.json(data)
  } catch (e: any) {
    const statusMap: Record<string, number> = {
      REQUEST_NOT_FOUND: 404,
      INVALID_STATUS: 400,
      FORBIDDEN: 403,
      PAYMENT_REQUIRED: 402,
    }
    const code = e.message.startsWith('INVALID_TRANSITION') ? 409
      : statusMap[e.message] ?? 500
    return NextResponse.json({ error: e.message }, { status: code })
  }
})

export const DELETE = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
    const supabase = await createClient()
    const { id } = await params
    try {
        const data = await serviceQueueService.deleteService(supabase, id)
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
})