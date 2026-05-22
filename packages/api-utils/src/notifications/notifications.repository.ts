import { SupabaseClient } from '@supabase/supabase-js'

export const notificationsRepository = {
  // Fetch notifications for a specific user
  listByUser: (supabase: SupabaseClient, userId: string) => {
    return supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  },

  // Set is_read to true for a specific notification
  markAsRead: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single()
  },

  // Mark all notifications as read for a user
  markAllAsRead: (supabase: SupabaseClient, userId: string) => {
    return supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .select()
  },

  // Insert a notification record
  insert: (
    supabase: SupabaseClient,
    payload: { user_id: string; content: string; type?: string }
  ) => {
    return supabase
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        content: payload.content,
        type: payload.type ?? 'system'
      })
      .select()
      .single()
  }
}
