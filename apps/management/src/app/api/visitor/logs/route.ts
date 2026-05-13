import { createClient } from '@/src/app/lib/supabase/server'
import { visitorService } from '@repo/api-utils/visitor'
import { withRole } from '@/src/app/lib/withRole'
import { NextResponse, type NextRequest } from 'next/server'

export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') ?? undefined

  try {
    const data = await visitorService.getAllLogs(supabase, date)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
})