-- Migration: Fix conversation_participants RLS infinite recursion
-- Create security definer function to bypass RLS recursion

CREATE OR REPLACE FUNCTION public.check_is_conversation_participant(conv_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id
    AND profile_id = user_id
  );
$$;

-- Drop and recreate policy for SELECT on conversation_participants
DROP POLICY IF EXISTS "view_conversation_participants" ON public.conversation_participants;

CREATE POLICY "view_conversation_participants" 
ON public.conversation_participants 
FOR SELECT 
TO authenticated 
USING (
  profile_id = auth.uid() 
  OR is_staff() 
  OR public.check_is_conversation_participant(conversation_id, auth.uid())
);
