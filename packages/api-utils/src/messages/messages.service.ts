import { SupabaseClient } from '@supabase/supabase-js'
import { messagesRepository } from './messages.repository'
import { notificationsService } from '../notifications/notifications.service'

export const messagesService = {
  // Get all conversations for the user
  listConversations: async (supabase: SupabaseClient) => {
    return await messagesRepository.listConversations(supabase)
  },

  // Get messages for a specific conversation
  listMessages: async (supabase: SupabaseClient, conversationId: string) => {
    return await messagesRepository.listMessages(supabase, conversationId)
  },

  // Send message to a conversation
  sendMessage: async (
    supabase: SupabaseClient,
    payload: { conversation_id: string; sender_id: string; content: string }
  ) => {
    const result = await messagesRepository.insertMessage(supabase, payload)
    if (!result.error) {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('profile_id')
        .eq('conversation_id', payload.conversation_id)
        .neq('profile_id', payload.sender_id)

      const recipientIds = (participants || []).map((p: any) => p.profile_id)
      await notificationsService.notifyUsersSafe(
        supabase,
        recipientIds,
        'You received a new message.',
        'message'
      )
    }
    return result
  },

  // Get or create a conversation between participants
  getOrCreateConversation: async (
    supabase: SupabaseClient,
    userIds: string[]
  ) => {
    // Check if conversation already exists
    const existingId = await messagesRepository.findConversationBetween(
      supabase,
      userIds
    )

    if (existingId) {
      return { data: { id: existingId }, error: null }
    }

    // Create conversation using RPC
    const { data: conversationId, error } = await supabase.rpc(
      'create_conversation',
      {
        participant_ids: userIds
      }
    )

    if (error || !conversationId) {
      return { data: null, error }
    }

    return {
      data: { id: conversationId },
      error: null
    }
  },
  broadcastMessage: async (
    supabase: SupabaseClient,
    senderId: string,
    content: string
  ) => {
    const { data: tenants, error: tenantsError } = await supabase
      .from('profiles')
      .select('id, role:roles!inner(name)')
      .eq('roles.name', 'tenant')

    if (tenantsError) {
      return { data: null, error: tenantsError }
    }

    const results = []
    for (const tenant of tenants || []) {
      const { data: conversation, error: convError } = await messagesService.getOrCreateConversation(
        supabase,
        [senderId, tenant.id]
      )
      if (convError || !conversation) {
        continue
      }

      const { error: msgError } = await messagesRepository.insertMessage(supabase, {
        conversation_id: conversation.id,
        sender_id: senderId,
        content
      })

      if (!msgError) {
        results.push({ tenant_id: tenant.id, conversation_id: conversation.id })
        await notificationsService.createNotificationSafe(
          supabase,
          {
            user_id: tenant.id,
            content: 'You received a new broadcast message from management.',
            type: 'message'
          }
        )
      }
    }

    return { data: results, error: null }
  }
}
