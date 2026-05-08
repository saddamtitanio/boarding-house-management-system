import { SupabaseClient } from '@supabase/supabase-js'
import { bookingsRepository } from './bookings.repository'

export const bookingsService = {
  async getBookings(supabase: SupabaseClient, role: string) {
    const isStaff = role === 'admin' || role === 'employee'

    const { data, error } = isStaff
      ? await bookingsRepository.listForManagement(supabase)
      : await bookingsRepository.listForTenant(supabase)

    return { data, error }
  },

  async getTenantBookings(supabase: SupabaseClient) {
    const { data, error } = await bookingsRepository.listForTenant(supabase)
    if (error) {
      throw new Error(error.message)
    }
    return { data, error }
  },

  async getBookingById(supabase: SupabaseClient, id: string) {
    const { data, error } = await bookingsRepository.getById(supabase, id)

    if (error) {
      const isNotFound = error.code === 'PGRST116'

      return {
        data: null,
        error: isNotFound ? 'Booking not found' : error.message,
        status: isNotFound ? 404 : 500
      }
    }

    return { data, error: null, status: 200 }
  },

  async updateBookingStatus(
    supabase: SupabaseClient,
    input: {
      id: string
      status: string
      decision_reason?: string
    }
  ) {
    if (!input.status) {
      return { error: 'Status is required', status: 400 }
    }

    if (input.status !== 'approved' && !input.decision_reason?.trim()) {
      return { error: 'Explanation is required', status: 400 }
    }

    const { data, error } = await bookingsRepository.updateStatus(supabase, {
      id: input.id,
      status: input.status,
      decision_reason: input.decision_reason?.trim() ?? ''
    })

    if (error) {
      return { error: error.message, status: 500 }
    }

    return { error: null, status: 200, data }
  }
}