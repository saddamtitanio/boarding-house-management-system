import { SupabaseClient } from '@supabase/supabase-js'

const baseSelect = `
  id,
  status,
  note,
  requested_at,
  tenant:profiles!service_requests_tenant_id_fkey (
    id,
    first_name,
    last_name,
    phone
  ),
  assigned_to:profiles!service_requests_assigned_to_fkey (
    id,
    first_name,
    last_name
  ),
  service:services (
    id,
    name,
    description,
    price,
    duration_h
  )
`

export const serviceRepository = {
  findAll: (supabase: SupabaseClient) => {
    return supabase
      .from('service_requests')
      .select(baseSelect)
      .order('requested_at', { ascending: true })
  },

  getAllServices: (supabase: SupabaseClient) => {
    return supabase
      .from('services')
      .select('*')
  },

  getServiceById: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('services')
      .select('*')
      .eq('id', id);
  },

  findByTenant: (supabase: SupabaseClient, tenantId: string) => {
    return supabase
      .from('service_requests')
      .select(baseSelect)
      .eq('tenant_id', tenantId)
      .order('requested_at', { ascending: false })
  },

  findById: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('service_requests')
      .select(baseSelect)
      .eq('id', id)
      .single()
  },

  findByStatus: (supabase: SupabaseClient, status: string) => {
    return supabase
      .from('service_requests')
      .select(baseSelect)
      .eq('status', status)
      .order('requested_at', { ascending: true })
  },

  insert: (supabase: SupabaseClient, payload: {
    tenant_id: string
    service_id: string
    note?: string | null
  }) => {
    return supabase
      .from('service_requests')
      .insert({ ...payload, status: 'pending' })
      .select(baseSelect)
      .single()
  },

  updateStatus: (supabase: SupabaseClient, id: string, status: string) => {
    return supabase
      .from('service_requests')
      .update({ status })
      .eq('id', id)
      .select(baseSelect)
      .single()
  },

  updateRequest: (supabase: SupabaseClient, id: string, updates: { status?: string; assigned_to?: string | null }) => {
    return supabase
      .from('service_requests')
      .update(updates)
      .eq('id', id)
      .select(baseSelect)
      .single()
  },

  createService: (supabase: SupabaseClient, payload: {
    name: string,
    description?: string | null,
    price: number,
    duration_h?: number
  }) => {
    return supabase
      .from('services')
      .insert({ ...payload })
      .select('*')
      .single()
  },

  updateService: (supabase: SupabaseClient, id: string, payload: {
    name: string,
    description?: string | null,
    price: number,
    duration_h?: number
  }) => {
    return supabase
      .from('services')
      .update({ ...payload })
      .eq('id', id)
      .select('*')
      .single()
  },

  deleteService: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('services')
      .delete()
      .eq('id', id)
      .select('*')
  },

  /*
  TODO: all the filter conditions
  */
}