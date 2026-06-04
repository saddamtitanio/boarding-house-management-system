import { SupabaseClient } from '@supabase/supabase-js'
import { tenantsRepository } from './tenants.repository'

export const tenantsService = {
  // Retrieve profile by ID
  getProfile: async (supabase: SupabaseClient, id: string) => {
    return await tenantsRepository.getProfile(supabase, id)
  },

  // Update profile details
  updateProfile: async (
    supabase: SupabaseClient,
    id: string,
    input: { first_name?: string; last_name?: string; phone?: string }
  ) => {
    return await tenantsRepository.updateProfile(supabase, id, input)
  },

  // Retrieve all tenants
  getAllTenants: async (supabase: SupabaseClient) => {
    return await tenantsRepository.listByRoleName(supabase, 'tenant')
  },

  // Retrieve all staff members (admin and employee) in parallel
  getAllStaff: async (supabase: SupabaseClient) => {
    const [adminsResult, employeesResult] = await Promise.all([
      tenantsRepository.listByRoleName(supabase, 'admin'),
      tenantsRepository.listByRoleName(supabase, 'employee')
    ])

    if (adminsResult.error) throw adminsResult.error
    if (employeesResult.error) throw employeesResult.error

    return { data: [...(adminsResult.data ?? []), ...(employeesResult.data ?? [])] }
  },

  // Retrieve all users (tenants, staff, etc.)
  getAllUsers: async (supabase: SupabaseClient) => {
    return await tenantsRepository.listAll(supabase)
  },

  // Update role of a specific user
  updateUserRole: async (supabase: SupabaseClient, userId: string, roleName: string) => {
    const roleId = await tenantsRepository.getRoleIdByName(supabase, roleName)
    if (!roleId) {
      return { data: null, error: new Error('Role not found') }
    }
    return await tenantsRepository.updateRole(supabase, userId, roleId)
  },

  // Create a new staff user utilizing Supabase Admin API
  createStaffUser: async (
    supabase: SupabaseClient,
    input: {
      email: string
      password?: string
      first_name: string
      last_name: string
      phone?: string
      role: 'admin' | 'employee'
    }
  ) => {
    // Attempt to create user via Auth Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password ?? 'KosanMama123!',
      email_confirm: true,
      user_metadata: {
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone
      }
    })

    if (authError || !authData.user) {
      return { data: null, error: authError }
    }

    const userId = authData.user.id
    const roleId = await tenantsRepository.getRoleIdByName(supabase, input.role)

    if (!roleId) {
      return { data: null, error: new Error(`Role ${input.role} not found`) }
    }

    // Update the auto-generated profile to correct role and name details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        role_id: roleId,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone ?? null
      })
      .eq('id', userId)
      .select()
      .single()

    if (profileError) {
      return { data: null, error: profileError }
    }

    return { data: profile, error: null }
  }
}
