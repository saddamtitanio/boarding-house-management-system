import { createClient } from '@/src/app/lib/supabase/server'
import { bookingsService } from '@repo/api-utils/bookings'
import { NextResponse, type NextRequest } from 'next/server'

// Retrieve booking history for the current tenant
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data } = await bookingsService.getTenantBookings(supabase)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Submit a new booking request
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { room_id, start_date, end_date } = body

    if (!room_id || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const result = await bookingsService.createBooking(supabase, {
      tenant_id: user.id,
      room_id,
      start_date,
      end_date
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}