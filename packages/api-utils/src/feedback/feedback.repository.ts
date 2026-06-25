import { SupabaseClient } from '@supabase/supabase-js'

export const feedbackRepository = {
  // List all feedback entries with tenant profiles
  listAll: (supabase: SupabaseClient) => {
    return supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        created_at,
        tenant:profiles (
          id,
          first_name,
          last_name,
          phone,
          leases (
            id,
            status,
            start_date,
            end_date,
            room:rooms (
              id,
              name
            )
          )
        )
      `)
      .order('created_at', { ascending: false })
  },

  // List feedback entries for a specific tenant
  listByTenant: (supabase: SupabaseClient, tenantId: string) => {
    return supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        created_at,
        tenant:profiles (
          id,
          first_name,
          last_name,
          phone,
          leases (
            id,
            status,
            start_date,
            end_date,
            room:rooms (
              id,
              name
            )
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
  },

  // Insert feedback
  insert: (
    supabase: SupabaseClient,
    payload: { tenant_id: string; rating: number; comment: string }
  ) => {
    return supabase
      .from('feedback')
      .insert({
        tenant_id: payload.tenant_id,
        rating: payload.rating,
        comment: payload.comment
      })
      .select()
      .single()
  }
}
