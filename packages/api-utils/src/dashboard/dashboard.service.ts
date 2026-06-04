import { SupabaseClient } from '@supabase/supabase-js'

export const dashboardService = {
    getStats: async (supabase: SupabaseClient) => {
    try {
      const now = new Date()

      // Define promise for rooms status
      const roomsPromise = supabase
        .from('rooms')
        .select('status')

      // Define promise for pending bookings count
      const pendingBookingsPromise = supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Define promise for active service requests (pending + in progress)
      const activeServicesPromise = supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_progress'])

      // Define promise for active visitor logs (not checked out)
      const activeVisitorsPromise = supabase
        .from('visitor_logs')
        .select('*', { count: 'exact', head: true })
        .is('check_out_at', null)

      // Define promise for overstaying tenants
      const overstayingTenantsPromise = supabase
        .from('leases')
        .select('id, end_date, tenant:profiles!leases_tenant_id_fkey(id, first_name, last_name), room:rooms!leases_room_id_fkey(id, name)')
        .eq('status', 'active')
        .lt('end_date', now.toISOString())

      // Define promise for pending service request details
      const pendingServicesPromise = supabase
        .from('service_requests')
        .select('id, status, service:services!service_requests_service_id_fkey(name), tenant:profiles!service_requests_tenant_id_fkey(first_name, last_name)')
        .in('status', ['pending', 'in_progress'])
        .order('requested_at', { ascending: false })
        .limit(5)

      // Define promises for occupancy trend (last 6 months)
      const occupancyPromises = []
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
        const monthLabel = targetDate.toLocaleString('en-US', { month: 'short', year: '2-digit' })

        const promise = supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .in('status', ['active', 'completed'])
          .lte('start_date', monthEnd.toISOString())
          .gte('end_date', monthStart.toISOString())
          .then(({ count, error }) => {
            if (error) throw error
            return {
              month: monthLabel,
              occupied: count ?? 0
            }
          })
        occupancyPromises.push(promise)
      }

      // Execute all Supabase queries in parallel
      const [
        roomsResult,
        bookingsResult,
        servicesResult,
        visitorsResult,
        overstayingResult,
        pendingServicesResult,
        occupancyResults
      ] = await Promise.all([
        roomsPromise,
        pendingBookingsPromise,
        activeServicesPromise,
        activeVisitorsPromise,
        overstayingTenantsPromise,
        pendingServicesPromise,
        Promise.all(occupancyPromises)
      ])

      // Process rooms results
      const { data: rooms, error: roomsError } = roomsResult
      if (roomsError) throw roomsError

      const roomStats = { vacant: 0, occupied: 0, cleaning: 0 }
      rooms?.forEach((r) => {
        if (r.status === 'vacant') roomStats.vacant++
        if (r.status === 'occupied') roomStats.occupied++
        if (r.status === 'cleaning') roomStats.cleaning++
      })
      const totalRooms = rooms?.length ?? 0

      // Process pending bookings results
      const { count: pendingBookings, error: bookingsError } = bookingsResult
      if (bookingsError) throw bookingsError

      // Process active services results
      const { count: activeServices, error: servicesError } = servicesResult
      if (servicesError) throw servicesError

      // Process active visitors results
      const { count: activeVisitors, error: visitorsError } = visitorsResult
      if (visitorsError) throw visitorsError

      // Process overstaying tenants
      const overstayingTenants = overstayingResult.data
      if (overstayingResult.error) throw overstayingResult.error

      const overstayingDetails = (overstayingTenants || []).map((l: any) => {
        const endDate = new Date(l.end_date)
        const daysOverdue = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
        return {
          tenant_name: l.tenant ? `${l.tenant.first_name} ${l.tenant.last_name || ''}`.trim() : 'Unknown',
          room_name: l.room?.name || 'Unknown',
          end_date: l.end_date,
          days_overdue: daysOverdue
        }
      })

      // Process pending services
      const pendingServices = pendingServicesResult.data
      if (pendingServicesResult.error) throw pendingServicesResult.error

      const pendingServiceDetails = (pendingServices || []).map((sr: any) => ({
        service_name: sr.service?.name || 'Unknown',
        tenant_name: sr.tenant ? `${sr.tenant.first_name} ${sr.tenant.last_name || ''}`.trim() : 'Unknown',
        status: sr.status
      }))

      // Process occupancy trend
      const occupancyTrend = occupancyResults.map((entry) => ({
        month: entry.month,
        occupied: Math.min(entry.occupied, totalRooms),
        vacant: Math.max(totalRooms - entry.occupied, 0)
      }))

      return {
        data: {
          rooms: roomStats,
          total_rooms: totalRooms,
          pending_bookings: pendingBookings ?? 0,
          active_service_requests: activeServices ?? 0,
          active_visitors: activeVisitors ?? 0,
          overstaying_tenants: overstayingDetails,
          pending_service_details: pendingServiceDetails,
          occupancy_trend: occupancyTrend
        },
        error: null
      }
    } catch (err: any) {
      return { data: null, error: err }
    }
  },

  // Compute occupancy trend for the last 6 months (parallelized version for external callers)
  getOccupancyTrend: async (supabase: SupabaseClient, totalRooms: number) => {
    try {
      const now = new Date()
      const promises = []

      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
        const monthLabel = targetDate.toLocaleString('en-US', { month: 'short', year: '2-digit' })

        // Count leases that overlap this month
        const promise = supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .in('status', ['active', 'completed'])
          .lte('start_date', monthEnd.toISOString())
          .gte('end_date', monthStart.toISOString())
          .then(({ count, error }) => {
            if (error) throw error
            const occupied = count ?? 0
            return {
              month: monthLabel,
              occupied: Math.min(occupied, totalRooms),
              vacant: Math.max(totalRooms - occupied, 0)
            }
          })
        promises.push(promise)
      }

      return await Promise.all(promises)
    } catch {
      return []
    }
  }
}

