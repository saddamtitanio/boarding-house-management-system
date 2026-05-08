import { SupabaseClient } from '@supabase/supabase-js'

const baseSelect = `
  id,
  visitor_name,
  visitor_phone,
  purpose,
  check_in_at,
  check_out_at,
  tenant:profiles!visitor_logs_tenant_id_fkey (
    id,
    first_name,
    phone
  ),
  room:rooms!visitor_logs_room_id_fkey (
    id,
    name
  )
`

export const visitorRepository = {
  findAll: (supabase: SupabaseClient, date?: string) => {
    let query = supabase
      .from('visitor_logs')
      .select(baseSelect)
      .order('check_in_at', { ascending: false })

    if (date) {
      query = query
        .gte('check_in_at', `${date}T00:00:00`)
        .lte('check_in_at', `${date}T23:59:59`)
    }

    return query
  },

  findByTenant: (supabase: SupabaseClient, tenantId: string) => {
    return supabase
      .from('visitor_logs')
      .select(baseSelect)
      .eq('tenant_id', tenantId)
      .order('check_in_at', { ascending: false })
  },

  findById: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('visitor_logs')
      .select(baseSelect)
      .eq('id', id)
      .single()
  },

  findActiveByTenant: (supabase: SupabaseClient, tenantId: string) => {
    return supabase
      .from('visitor_logs')
      .select(baseSelect)
      .eq('tenant_id', tenantId)
      .is('check_out_at', null)
      .order('check_in_at', { ascending: false })
  },

  insert: (supabase: SupabaseClient, payload: {
    tenant_id: string
    room_id: string
    visitor_name: string
    visitor_phone?: string
    purpose?: string
  }) => {
    return supabase
      .from('visitor_logs')
      .insert(payload)
      .select(baseSelect)
      .single()
  },

  updateCheckOut: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('visitor_logs')
      .update({ check_out_at: new Date().toISOString() })
      .eq('id', id)
      .is('check_out_at', null)
      .select(baseSelect)
      .single()
  },
}