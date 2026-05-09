/* ── Profiles ── */
export interface Profile {
  id: string;           // uuid
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: string;      // uuid
  created_at: string;
  updated_at: string;
}

/* ── Conversations ── */
export interface Conversation {
  id: string;           // uuid
  created_at: string;   // timestamptz
  participants: Profile[];
  last_message?: Message;
  unread_count?: number;
}

/* ── Conversation participants ── */
export interface ConversationParticipant {
  conversation_id: string;  // uuid
  profile_id: string;       // uuid
}

/* ── Messages ── */
export interface Message {
  id: string;               // uuid
  conversation_id: string;  // uuid
  sender_id: string;        // uuid
  content: string;          // text
  created_at: string;       // timestamptz
}

/* ── Request types ── */
export interface CreateConversationRequest {
  participant_ids: string[]; // profile uuids to include (besides the current user)
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
}

/* ── Response types ── */
export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}
