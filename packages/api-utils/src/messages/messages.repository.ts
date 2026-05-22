import { SupabaseClient } from '@supabase/supabase-js'

export const messagesRepository = {
  // Fetch conversations for the current user
  listConversations: (supabase: SupabaseClient) => {
    return supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        conversation_participants (
          profile:profiles (
            id,
            first_name,
            last_name,
            phone,
            role:roles (
              id,
              name
            )
          )
        )
      `)
  },

  // Fetch messages in a conversation
  listMessages: (supabase: SupabaseClient, conversationId: string) => {
    return supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        sender:profiles!messages_sender_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
  },

  // Send a message
  insertMessage: (
    supabase: SupabaseClient,
    payload: { conversation_id: string; sender_id: string; content: string }
  ) => {
    return supabase
      .from('messages')
      .insert({
        conversation_id: payload.conversation_id,
        sender_id: payload.sender_id,
        content: payload.content
      })
      .select(`
        id,
        content,
        created_at,
        sender_id,
        sender:profiles!messages_sender_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .single()
  },

  // Create a conversation
  insertConversation: (supabase: SupabaseClient) => {
    return supabase
      .from('conversations')
      .insert({})
      .select()
      .single()
  },

  // Add a participant to a conversation
  insertParticipant: (supabase: SupabaseClient, conversationId: string, profileId: string) => {
    return supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversationId,
        profile_id: profileId
      })
      .select()
      .single()
  },

  // Check if a conversation between exact participants exists
  findConversationBetween: async (supabase: SupabaseClient, userIds: string[]) => {
    // Fetch all conversations where userIds[0] is participant
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', userIds[0])

    if (!participants || participants.length === 0) return null

    const conversationIds = participants.map((p) => p.conversation_id)

    // Fetch details of those conversations to see which one has exactly these participants
    const { data: convs } = await supabase
      .from('conversations')
      .select(`
        id,
        conversation_participants (
          profile_id
        )
      `)
      .in('id', conversationIds)

    if (!convs) return null

    for (const c of convs) {
      const currentParticipants = c.conversation_participants.map((cp) => cp.profile_id)
      if (
        currentParticipants.length === userIds.length &&
        userIds.every((uid) => currentParticipants.includes(uid))
      ) {
        return c.id
      }
    }

    return null
  }
}
