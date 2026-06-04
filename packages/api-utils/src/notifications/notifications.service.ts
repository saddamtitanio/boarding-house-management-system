import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { notificationsRepository } from './notifications.repository'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

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
    const client = getAdminClient() || supabase
    return await notificationsRepository.insert(client, payload)
  },

  createNotificationSafe: async (
    supabase: SupabaseClient,
    payload: { user_id: string; content: string; type?: string }
  ) => {
    try {
      const client = getAdminClient() || supabase
      await notificationsRepository.insert(client, payload)
    } catch (error) {
      console.error('Failed to create notification:', error)
    }
  },

  notifyUsersSafe: async (
    supabase: SupabaseClient,
    userIds: string[],
    content: string,
    type: string = 'system'
  ) => {
    const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean)
    if (uniqueUserIds.length === 0) return
    try {
      const adminClient = getAdminClient() || supabase
      const rows = uniqueUserIds.map((userId) => ({
        user_id: userId,
        content,
        type
      }))
      await adminClient.from('notifications').insert(rows)
    } catch (error) {
      console.error('Failed to create bulk notifications:', error)
    }
  },

  notifyManagementSafe: async (
    supabase: SupabaseClient,
    content: string,
    type: string = 'system'
  ) => {
    try {
      const adminClient = getAdminClient() || supabase
      const { data: staff } = await adminClient
        .from('profiles')
        .select('id, roles!inner(name)')
        .in('roles.name', ['admin', 'employee'])

      const staffIds = (staff || []).map((member: any) => member.id)
      await notificationsService.notifyUsersSafe(adminClient, staffIds, content, type)
    } catch (error) {
      console.error('Failed to notify management:', error)
    }
  }
}
