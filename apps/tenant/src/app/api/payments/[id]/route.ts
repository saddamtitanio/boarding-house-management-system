import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { paymentsService } from '@repo/api-utils/payments'

// Fetch details for a specific payment, including its invoice if available
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: payment, error } = await paymentsService.getPaymentById(supabase, id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch invoice details linked to this payment
  const { data: invoice } = await paymentsService.getInvoiceByPayment(supabase, id)

  return NextResponse.json({
    success: true,
    data: {
      ...payment,
      invoice
    }
  })
}

// Update payment details (e.g. providing payment gateway reference code)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { status, gateway_ref } = body

  const { data, error } = await paymentsService.updatePaymentStatus(
    supabase,
    id,
    status || 'pending',
    gateway_ref
  )

  if (error) {
    console.log(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
