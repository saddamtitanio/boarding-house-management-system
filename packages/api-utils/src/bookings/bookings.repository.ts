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
  }
}