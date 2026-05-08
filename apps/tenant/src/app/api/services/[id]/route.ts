import { createClient } from '@/src/app/lib/supabase/server'
import { serviceQueueService } from '@repo/api-utils/service'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const data = await serviceQueueService.getServiceById(supabase, id);
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}