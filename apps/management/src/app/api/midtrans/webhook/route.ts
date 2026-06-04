import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paymentsService } from '@repo/api-utils/payments'

/**
 * Midtrans Webhook Notification Handler
 * URL: https://sbhms-management.vercel.app/api/midtrans/webhook
 * 
 * This endpoint receives POST requests from Midtrans when a payment
 * status changes (settlement, pending, expire, cancel, deny, refund).
 * 
 * Uses the SERVICE ROLE key to bypass RLS since Midtrans sends 
 * unauthenticated requests.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log('[Midtrans Webhook] Received notification:', JSON.stringify(body, null, 2))

    // Create a service-role Supabase client (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Midtrans Webhook] Missing Supabase credentials')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data, error } = await paymentsService.processMidtransNotification(supabase, body)

    if (error) {
      console.error('[Midtrans Webhook] Processing error:', error.message)
      // Still return 200 to prevent Midtrans from retrying
      return NextResponse.json({ status: 'error', message: error.message }, { status: 200 })
    }

    console.log('[Midtrans Webhook] Successfully processed:', data)
    return NextResponse.json({ status: 'ok', data }, { status: 200 })
  } catch (err: any) {
    console.error('[Midtrans Webhook] Unexpected error:', err)
    // Return 200 to prevent infinite retries from Midtrans
    return NextResponse.json({ status: 'error', message: err?.message || 'Unexpected error' }, { status: 200 })
  }
}

// Midtrans may also send GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Midtrans webhook endpoint is active' })
}
