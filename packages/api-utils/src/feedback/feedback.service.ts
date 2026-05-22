import { SupabaseClient } from '@supabase/supabase-js'
import { feedbackRepository } from './feedback.repository'

export const feedbackService = {
  // Get all feedback entries
  getAllFeedback: async (supabase: SupabaseClient) => {
    return await feedbackRepository.listAll(supabase)
  },

  // Record a new feedback entry
  createFeedback: async (
    supabase: SupabaseClient,
    payload: { tenant_id: string; rating: number; comment: string }
  ) => {
    return await feedbackRepository.insert(supabase, payload)
  }
}
