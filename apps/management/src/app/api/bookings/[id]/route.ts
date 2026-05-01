import { NextResponse } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    const isNotFound = error?.code === 'PGRST116'
    if (isNotFound) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data
  })
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // get new status
  const body = await req.json();
  if (!body?.status) {
    return NextResponse.json({ error: 'Status is required' }, { status: 400 });
  }

  // require explanation if status is "rejected" (or any status needing a message)
  if (body.status !== 'approved' && !body.decision_reason?.trim()) {
    return NextResponse.json({ error: 'Explanation is required' }, { status: 400 });
  }

  if (body.decision_reason === undefined) {
    body.decision_reason = "";
  }

  // call the postgres function that enforces RLS and audit logging
  const { error } = await supabase.rpc('update_booking_status', {
    booking_id: id,
    new_status: body.status,
    message_desc: body.decision_reason?.trim()
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}