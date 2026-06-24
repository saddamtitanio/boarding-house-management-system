import { SupabaseClient } from '@supabase/supabase-js'

export const tenantsRepository = {
  // Get profile by user ID
  getProfile: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        avatar_url,
        created_at,
        role:roles (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()
  },

  // Update profile attributes
  updateProfile: (
    supabase: SupabaseClient,
    id: string,
    input: { first_name?: string; last_name?: string; phone?: string; avatar_url?: string | null }
  ) => {
    return supabase
      .from('profiles')
      .update({
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
        avatar_url: input.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  },

  // Fetch all profiles belonging to a specific role name
  listByRoleName: (supabase: SupabaseClient, roleName: string) => {
    return supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        created_at,
        role:roles!inner (
          id,
          name
        )
      `)
      .eq('roles.name', roleName)
  },

  // Fetch all profiles in the system with their roles
  listAll: (supabase: SupabaseClient) => {
    return supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        created_at,
        role:roles!profiles_role_id_fkey (
          id,
          name
        )
      `)
  },

  // Find a role ID based on the role name
  getRoleIdByName: async (supabase: SupabaseClient, name: string) => {
    const { data, error } = await supabase
      .from('roles')
      .select('id')
      .eq('name', name)
      .maybeSingle()
    if (error) throw error
    return data?.id ?? null
  },

  // Update role reference for a profile
  updateRole: (supabase: SupabaseClient, userId: string, roleId: string) => {
    return supabase
      .from('profiles')
      .update({ role_id: roleId })
      .eq('id', userId)
      .select()
      .single()
  }
}
