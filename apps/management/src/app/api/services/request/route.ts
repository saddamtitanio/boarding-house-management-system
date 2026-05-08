import { createClient } from '@/src/app/lib/supabase/server'
import { serviceQueueService } from '@repo/api-utils/service'
import { NextResponse, type NextRequest } from 'next/server'
import { withRole } from '@/src/app/lib/withRole'

/* TODO: handle more filtering conditions */
export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  try {
    const data = status
      ? await serviceQueueService.getRequestsByStatus(supabase, status)
      : await serviceQueueService.getAllRequests(supabase)
    return NextResponse.json(data)
  } catch (e: any) {
    const status_code = e.message === 'INVALID_STATUS' ? 400 : 500
    return NextResponse.json({ error: e.message }, { status: status_code })
  }
})