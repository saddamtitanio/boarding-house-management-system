import { SupabaseClient } from '@supabase/supabase-js'

const baseSelect = `
  id,
  start_date,
  end_date,
  status,
  created_at,
  decision_reason,
  room:rooms (
    id,
    name,
    floor,
    price,
    status
  ),
  tenant:profiles (
    id,
    first_name,
    last_name,
    phone
  )
`

export const bookingsRepository = {
  listForTenant: (supabase: SupabaseClient) => {
    return supabase
      .from('bookings')
      .select(baseSelect)
      .order('created_at', { ascending: true })
  },

  listForManagement: (supabase: SupabaseClient) => {
    return supabase
      .from('bookings')
      .select(baseSelect)
      .order('created_at', { ascending: true })
  },

  getById: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('bookings')
      .select(baseSelect)
      .eq('id', id)
      .single()
  },

  updateStatus: (
    supabase: SupabaseClient,
    input: {
      id: string
      status: string
      decision_reason: string
    }
  ) => {
    return supabase.rpc('update_booking_status', {
      booking_id: input.id,
      new_status: input.status,
      message_desc: input.decision_reason
    })
  },

  requestRenew: (supabase: SupabaseClient, bookingId: string, input: {
    end_date: string
  }) => {
    return supabase.rpc('request_lease_renewal', {
      p_booking_id: bookingId,
      p_new_end_date: input.end_date,
    })
  },

  create: (
    supabase: SupabaseClient,
    input: {
      tenant_id: string
      room_id: string
      start_date: string
      end_date: string
    }
  ) => {
    return supabase
      .from('bookings')
      .insert({
        tenant_id: input.tenant_id,
        room_id: input.room_id,
        start_date: input.start_date,
        end_date: input.end_date,
        status: 'pending'
      })
      .select(baseSelect)
      .single()
  },

  approveBooking: (supabase: SupabaseClient, bookingId: string) => {
    return supabase.rpc('approve_booking', {
      p_booking_id: bookingId
    })
  },
  
}