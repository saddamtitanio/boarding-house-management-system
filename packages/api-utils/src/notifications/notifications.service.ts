import { SupabaseClient } from '@supabase/supabase-js'
import { notificationsRepository } from './notifications.repository'

export const notificationsService = {
  // Get all notifications for a specific user
  listNotifications: async (supabase: SupabaseClient, userId: string) => {
    return await notificationsRepository.listByUser(supabase, userId)
  },

  // Mark single notification as read
  markNotificationRead: async (supabase: SupabaseClient, id: string) => {
    return await notificationsRepository.markAsRead(supabase, id)
  },

  // Mark all notifications as read for a user
  markAllNotificationsRead: async (supabase: SupabaseClient, userId: string) => {
    return await notificationsRepository.markAllAsRead(supabase, userId)
  },

  // Create a notification
  createNotification: async (
    supabase: SupabaseClient,
    payload: { user_id: string; content: string; type?: string }
  ) => {
    return await notificationsRepository.insert(supabase, payload)
  }
}
