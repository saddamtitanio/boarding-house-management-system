import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'

// Retrieve aggregated stats and data for the tenant dashboard
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {

    // Fetch lease (if exists)
    const { data: leaseData, error: leaseError } = await supabase
      .from('leases')
      .select(`*,
        room:rooms!leases_room_id_fkey(*)
      `)
      .eq('tenant_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    
    if (leaseError) {
      console.log(leaseError)
    }

    // Fetch active/latest booking for the tenant
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, room:rooms(*)')
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false })

    const activeBooking = bookings && bookings.length > 0 ? bookings[0] : null

    // 2. Fetch pending payments for their bookings
    let unpaidAmount = 0
    let unpaidCount = 0

    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map(b => b.id)
      const { data: pendingPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .in('booking_id', bookingIds)
        .eq('status', 'pending')

      if (!paymentsError && pendingPayments) {
        unpaidCount = pendingPayments.length
        unpaidAmount = pendingPayments.reduce((acc, p) => acc + Number(p.amount), 0)
      }
    }

    // Fetch active service requests
    const { data: serviceRequests, error: servicesError } = await supabase
      .from('service_requests')
      .select('*, service:services!service_requests_service_id_fkey (*)')
      .eq('tenant_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(5)
    
    // Fetch recent visitor logs
    const { data: visitorLogs, error: visitorsError } = await supabase
      .from('visitor_logs')
      .select('*')
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Lease expiry warning check (7 days and 3 days)
    let lease_expiry_warning: string | null = null
    if (leaseData && leaseData.end_date) {
      const endDate = new Date(leaseData.end_date)
      const now = new Date()
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysRemaining <= 0) {
        lease_expiry_warning = 'expired'
      } else if (daysRemaining <= 3) {
        lease_expiry_warning = '3_days'
      } else if (daysRemaining <= 7) {
        lease_expiry_warning = '7_days'
      }

      // Send warning notifications (avoid duplicates by checking recent notifications)
      if (lease_expiry_warning && lease_expiry_warning !== 'expired') {
        const warningMsg = daysRemaining <= 3
          ? `Your lease expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}! Please renew soon to keep your room.`
          : `Your lease expires in ${daysRemaining} days. Consider renewing to avoid losing your room.`

        // Check if we already sent a similar warning today
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { data: existingNotifs } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'lease_warning')
          .gte('created_at', todayStart.toISOString())
          .limit(1)

        if (!existingNotifs || existingNotifs.length === 0) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            content: warningMsg,
            type: 'lease_warning'
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        active_lease: leaseData,
        active_booking: activeBooking,
        unpaid_payments_count: unpaidCount,
        unpaid_payments_amount: unpaidAmount,
        service_requests: serviceRequests || [],
        visitor_logs: visitorLogs || [],
        lease_expiry_warning
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
