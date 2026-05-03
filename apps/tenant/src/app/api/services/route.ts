import { createClient } from '@/src/app/lib/supabase/server'
import { serviceQueueService } from '@repo/api-utils/service'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  try {
    const data = await serviceQueueService.getAllServices(supabase);
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}