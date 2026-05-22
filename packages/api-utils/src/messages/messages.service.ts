import { SupabaseClient } from '@supabase/supabase-js'
import { messagesRepository } from './messages.repository'

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
    return await messagesRepository.insertMessage(supabase, payload)
  },

  // Get or create a conversation between participants
  getOrCreateConversation: async (supabase: SupabaseClient, userIds: string[]) => {
    // Check if conversation already exists
    const existingId = await messagesRepository.findConversationBetween(supabase, userIds)
    if (existingId) {
      return { data: { id: existingId }, error: null }
    }

    // Otherwise create conversation
    const { data: conversation, error: convError } = await messagesRepository.insertConversation(supabase)
    if (convError || !conversation) {
      return { data: null, error: convError }
    }

    // Add all participants
    for (const userId of userIds) {
      const { error: partError } = await messagesRepository.insertParticipant(
        supabase,
        conversation.id,
        userId
      )
      if (partError) {
        return { data: null, error: partError }
      }
    }

    return { data: conversation, error: null }
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
      }
    }

    return { data: results, error: null }
  }
}
