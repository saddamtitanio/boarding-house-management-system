import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { paymentsService } from '@repo/api-utils/payments'

// Get all payments for the logged-in tenant
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await paymentsService.getTenantPayments(supabase, user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

// Record a new payment entry
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { booking_id, amount, status, gateway_ref } = body

  if (!booking_id || !amount) {
    return NextResponse.json({ error: 'booking_id and amount are required' }, { status: 400 })
  }

  const { data, error } = await paymentsService.createPayment(supabase, {
    booking_id,
    amount,
    status: status || 'pending',
    gateway_ref
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
