import { createClient } from '@/src/app/lib/supabase/server'
import { serviceQueueService } from '@repo/api-utils/service'
import { NextResponse, type NextRequest } from 'next/server'
import { withRole } from '@/src/app/lib/withRole'

export const GET = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const supabase = await createClient()
  try {
    const data = await serviceQueueService.getRequestById(supabase, params.id)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
})

export const PATCH = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const supabase = await createClient()
  const { status } = await req.json()

  if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 })

  // get current user's id and role from claims
  const { data } = await supabase.auth.getClaims()
  const requesterId = data?.claims?.sub
  const requesterRole = data?.claims?.app_metadata?.role

  if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await serviceQueueService.updateRequestStatus(
      supabase,
      params.id,
      status,
      requesterId,
      requesterRole
    )
    return NextResponse.json(data)
  } catch (e: any) {
    const statusMap: Record<string, number> = {
      REQUEST_NOT_FOUND: 404,
      INVALID_STATUS: 400,
      FORBIDDEN: 403,
    }
    const code = e.message.startsWith('INVALID_TRANSITION') ? 409
      : statusMap[e.message] ?? 500
    return NextResponse.json({ error: e.message }, { status: code })
  }
})

export const DELETE = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
    const supabase = await createClient()
    try {
        const data = await serviceQueueService.deleteService(supabase, params.id)
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
})