-- Migration: Allow Tenant to Start Conversation
-- Drop existing policies if any to avoid duplication errors

DROP POLICY IF EXISTS "insert_conversations" ON public.conversations;
CREATE POLICY "insert_conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "insert_conversation_participants" ON public.conversation_participants;
CREATE POLICY "insert_conversation_participants" 
ON public.conversation_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "view_conversation_participants" ON public.conversation_participants;
CREATE POLICY "view_conversation_participants" 
ON public.conversation_participants 
FOR SELECT 
TO authenticated 
USING (
  profile_id = auth.uid() 
  OR is_staff() 
  OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.profile_id = auth.uid()
  )
);
