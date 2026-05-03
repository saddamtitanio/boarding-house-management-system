import { createClient } from '@/src/app/lib/supabase/server'
import { serviceQueueService } from '@repo/api-utils/service'
import { NextResponse, type NextRequest } from 'next/server'
import { withRole } from '@/src/app/lib/withRole'

/* TODO: handle more filtering conditions */
export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()

  try {
    const data = await serviceQueueService.getAllServices(supabase)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
})

export const POST = withRole(['admin'], async (req: NextRequest) => {
  const supabase = await createClient()

  try {
    const payload = await req.json()
    const data = await serviceQueueService.addService(supabase, {...payload, description: payload.description ?? null})
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
})