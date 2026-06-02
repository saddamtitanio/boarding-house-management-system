import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { paymentsService } from '@repo/api-utils/payments'

// Fetch details for a specific payment
export const GET = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await paymentsService.getPaymentById(supabase, id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})

// Update payment status (e.g. approve a pending payment to paid)
export const PATCH = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await paymentsService.updatePaymentStatus(
    supabase,
    id,
    body.status,
    body.gateway_ref
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})
