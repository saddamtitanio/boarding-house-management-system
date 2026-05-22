import { SupabaseClient } from '@supabase/supabase-js'

export const dashboardService = {
  // Aggregate administrative statistics for the dashboard
  getStats: async (supabase: SupabaseClient) => {
    try {
      // 1. Query rooms counts by status
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('status')

      if (roomsError) throw roomsError

      const roomStats = { vacant: 0, occupied: 0, cleaning: 0 }
      rooms?.forEach((r) => {
        if (r.status === 'vacant') roomStats.vacant++
        if (r.status === 'occupied') roomStats.occupied++
        if (r.status === 'cleaning') roomStats.cleaning++
      })

      // 2. Query pending bookings count
      const { count: pendingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (bookingsError) throw bookingsError

      // 3. Query active service requests (pending + in progress)
      const { count: activeServices, error: servicesError } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_progress'])

      if (servicesError) throw servicesError

      // 4. Query active visitor logs (not checked out)
      const { count: activeVisitors, error: visitorsError } = await supabase
        .from('visitor_logs')
        .select('*', { count: 'exact', head: true })
        .is('check_out_at', null)

      if (visitorsError) throw visitorsError

      // 5. Query pending payments (unpaid balances)
      const { data: pendingPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'pending')

      if (paymentsError) throw paymentsError

      const unpaidAmount = pendingPayments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0
      const unpaidCount = pendingPayments?.length ?? 0

      return {
        data: {
          rooms: roomStats,
          total_rooms: rooms?.length ?? 0,
          pending_bookings: pendingBookings ?? 0,
          active_service_requests: activeServices ?? 0,
          active_visitors: activeVisitors ?? 0,
          unpaid_payments_count: unpaidCount,
          unpaid_payments_amount: unpaidAmount
        },
        error: null
      }
    } catch (err: any) {
      return { data: null, error: err }
    }
  }
}
