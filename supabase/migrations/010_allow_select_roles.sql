-- Allow select on roles
CREATE POLICY "view_roles" ON public.roles FOR SELECT TO authenticated USING (true);

-- Allow select on profiles for all authenticated users (needed for messaging details)
DROP POLICY IF EXISTS "own_profile" ON public.profiles;
CREATE POLICY "view_all_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Allow users to update their own profile details (first_name, last_name, phone)
CREATE POLICY "tenant_update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Allow admins to update all user profiles
CREATE POLICY "admin_update_profiles" ON public.profiles FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Allow inserting conversations
CREATE POLICY "insert_conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);

-- Allow viewing and inserting conversation participants
CREATE POLICY "view_conversation_participants" ON public.conversation_participants FOR SELECT TO authenticated USING (
  profile_id = auth.uid() 
  OR is_staff() 
  OR EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.profile_id = auth.uid()
  )
);

CREATE POLICY "insert_conversation_participants" ON public.conversation_participants FOR INSERT TO authenticated WITH CHECK (true);

-- Allow inserting messages
CREATE POLICY "insert_messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.profile_id = auth.uid()
  )
);
