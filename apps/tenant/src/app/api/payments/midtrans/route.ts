import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { paymentsService } from '@repo/api-utils/payments'

/**
 * Create a Midtrans Snap transaction for a given payment.
 * Returns the snap_token for the frontend to open the Snap popup.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { payment_id } = body

  if (!payment_id) {
    return NextResponse.json({ error: 'payment_id is required' }, { status: 400 })
  }

  const { data, error } = await paymentsService.createMidtransTransaction(supabase, payment_id)

  if (error) {
    console.error('[Midtrans Snap] Error creating transaction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
