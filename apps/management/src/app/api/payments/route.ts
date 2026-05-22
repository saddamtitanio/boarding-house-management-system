import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { paymentsService } from '@repo/api-utils/payments'

// List all payments
export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  const { data, error } = await paymentsService.getAllPayments(supabase)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})

// Create a new payment record
export const POST = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await paymentsService._createPayment(supabase, body)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})
