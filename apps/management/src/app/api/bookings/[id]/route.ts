import { NextResponse } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { NextRequest } from 'next/server'
import { bookingsService } from '@repo/api-utils/bookings'

export async function GET (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient()
  const result = await bookingsService.getBookingById(supabase, id);

  return NextResponse.json(
    result.error ? { error: result.error } : { success: true, data: result.data},
    { status: result. status}
  )
}


export async function PATCH (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();

  const result = await bookingsService.updateBookingStatus(supabase, {
    id,
    status: body.status,
    decision_reason: body.decision_reason
  })

  return NextResponse.json(
    result.error ? { error: result.error } : { success: true, data: result.data },
    { status: result.status }
  )
}
