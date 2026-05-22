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
  },

  async createBooking(
    supabase: SupabaseClient,
    input: {
      tenant_id: string
      room_id: string
      start_date: string
      end_date: string
    }
  ) {
    const { data, error } = await bookingsRepository.create(supabase, input)
    if (error) {
      return { error: error.message, status: 500 }
    }
    return { data, error: null, status: 200 }
  },
  
  async _approveBooking(supabase: SupabaseClient, bookingId: string) {
    const { data, error } = await bookingsRepository.approveBooking(supabase, bookingId)

    if (error) {
      return { data: null, error: error.message, status: 500 }
    }

    if (!data.success) {
      const isConflict = data.error?.includes('Only pending')
      return {
        data: null,
        error: data.error,
        status: isConflict ? 409 : 500
      }
    }

    return {
      data: {
        bookingId: data.booking_id,
        paymentId: data.payment_id,
        expiresAt: data.expires_at
      },
      error: null,
      status: 200
    }
  },
}