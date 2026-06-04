import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { messagesRepository } from './messages.repository'
import { notificationsService } from '../notifications/notifications.service'

function getAdminClient(fallback: SupabaseClient): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return fallback
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const messagesService = {
  // Get all conversations for the user
  listConversations: async (supabase: SupabaseClient) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: new Error('Unauthorized') }
    }
    return await messagesRepository.listConversations(supabase, user.id)
  },

  // Get messages for a specific conversation
  listMessages: async (supabase: SupabaseClient, conversationId: string) => {
    const { data, error } = await messagesRepository.listMessages(supabase, conversationId)
    if (data && Array.isArray(data)) {
      // Revert from DESC (database representation for latest 100 limit) back to ASC (chronological chat display)
      return { data: [...data].reverse(), error: null }
    }
    return { data, error }
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
      
      let senderName = 'Someone'
      let senderRole = 'tenant'
      try {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, role:roles(name)')
          .eq('id', payload.sender_id)
          .maybeSingle()

        if (senderProfile) {
          senderName = `${senderProfile.first_name} ${senderProfile.last_name || ''}`.trim()
          senderRole = (senderProfile.role as any)?.name || 'tenant'
        }
      } catch (err) {
        console.error('Failed to resolve sender name and role for message notification:', err)
      }

      const preview = payload.content.length > 50
        ? payload.content.substring(0, 47) + '...'
        : payload.content

      const messageContent = `New message from ${senderName}: "${preview}"`

      if (senderRole === 'tenant') {
        // Tenant is the sender: notify management
        await notificationsService.notifyManagementSafe(supabase, messageContent, 'message')

        // Also notify other participants who are not staff to prevent duplicate notifications
        try {
          const adminClient = getAdminClient(supabase)
          const { data: staff } = await adminClient
            .from('profiles')
            .select('id, roles!inner(name)')
            .in('roles.name', ['admin', 'employee'])

          const staffIds = (staff || []).map((member: any) => member.id)
          const otherRecipientIds = recipientIds.filter((id: string) => !staffIds.includes(id))

          if (otherRecipientIds.length > 0) {
            await notificationsService.notifyUsersSafe(
              supabase,
              otherRecipientIds,
              messageContent,
              'message'
            )
          }
        } catch (err) {
          console.error('Failed to filter staff recipients, falling back:', err)
          await notificationsService.notifyUsersSafe(
            supabase,
            recipientIds,
            messageContent,
            'message'
          )
        }
      } else {
        // Staff sending message: notify recipients
        await notificationsService.notifyUsersSafe(
          supabase,
          recipientIds,
          messageContent,
          'message'
        )
      }
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
    const adminClient = getAdminClient(supabase)
    const { data: tenants, error: tenantsError } = await adminClient
      .from('profiles')
      .select('id, role:roles!inner(name)')
      .eq('roles.name', 'tenant')

    if (tenantsError) {
      return { data: null, error: tenantsError }
    }

    const results = []
    for (const tenant of tenants || []) {
      const { data: conversation, error: convError } = await messagesService.getOrCreateConversation(
        adminClient,
        [senderId, tenant.id]
      )
      if (convError || !conversation) {
        continue
      }

      const { error: msgError } = await messagesRepository.insertMessage(adminClient, {
        conversation_id: conversation.id,
        sender_id: senderId,
        content
      })

      if (!msgError) {
        results.push({ tenant_id: tenant.id, conversation_id: conversation.id })
        
        const preview = content.length > 50
          ? content.substring(0, 47) + '...'
          : content

        await notificationsService.createNotificationSafe(
          adminClient,
          {
            user_id: tenant.id,
            content: `Broadcast from Management: "${preview}"`,
            type: 'message'
          }
        )
      }
    }

    return { data: results, error: null }
  }
}
