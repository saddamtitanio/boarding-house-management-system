import { createClient } from '@/src/app/lib/supabase/server'
import { serviceQueueService } from '@repo/api-utils/service'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { id } = await params;

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await serviceQueueService.getRequestById(supabase, id)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// tenant cancels own request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { id } = await params;

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await serviceQueueService.cancelRequest(supabase, id, user.id)
    return NextResponse.json(data)
  } catch (e: any) {
    const statusMap: Record<string, number> = {
      REQUEST_NOT_FOUND: 404,
      FORBIDDEN: 403,
    }
    const status = e.message.startsWith('INVALID_TRANSITION') ? 409
      : statusMap[e.message] ?? 500
    return NextResponse.json({ error: e.message }, { status })
  }
}