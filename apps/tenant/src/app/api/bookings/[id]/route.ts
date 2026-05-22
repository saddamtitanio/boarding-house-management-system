import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createUserClient } from '@/src/app/lib/supabase/server'
import { bookingsService } from '@repo/api-utils/bookings'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Retrieve booking details for the current tenant
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: booking, error, status } = await bookingsService.getBookingById(supabase, id)

    if (error || !booking) {
      return NextResponse.json({ error: error || 'Booking not found' }, { status })
    }

    // Verify ownership: ensure this booking belongs to the logged-in tenant
    const tenant = booking.tenant as any
    const tenantId = Array.isArray(tenant) ? tenant[0]?.id : tenant?.id

    if (tenantId !== user.id) {
      return NextResponse.json({ error: 'Access denied: you do not own this booking' }, { status: 403 })
    }

    // Fetch associated payments
    const { data: payments } = await supabase
      .from('payments')
      .select('id, amount, status, type, expires_at, created_at')
      .eq('booking_id', id)

    // Normalize tenant to be an object instead of array if it is an array in Supabase types
    const bookingWithPayments = {
      ...booking,
      tenant: Array.isArray(tenant) ? tenant[0] : tenant,
      payments: payments || []
    }

    return NextResponse.json({ success: true, data: bookingWithPayments })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Handle tenant booking cancellation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userClient = await createUserClient()
  const { data: { user } } = await userClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { status } = body

    if (status !== 'cancelled') {
      return NextResponse.json({ error: 'Tenants are only allowed to cancel reservations' }, { status: 400 })
    }

    // 1. Fetch booking to verify ownership
    const { data: booking, error: fetchError } = await adminSupabase
      .from('bookings')
      .select('tenant_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.tenant_id !== user.id) {
      return NextResponse.json({ error: 'Access denied: you do not own this booking' }, { status: 403 })
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending bookings can be cancelled' }, { status: 400 })
    }

    // 2. Perform the update using adminSupabase (RPC or raw update)
    const { data, error: updateError } = await adminSupabase
      .from('bookings')
      .update({ status: 'cancelled', decision_reason: 'Cancelled by tenant' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
