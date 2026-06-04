-- Drop the existing coarse RLS policy for expenses
DROP POLICY IF EXISTS "staff_expenses" ON public.expenses;

-- 1. Allow all staff (admin & employee) to view (SELECT) expenses
CREATE POLICY "staff_select_expenses"
ON public.expenses
FOR SELECT
TO authenticated
USING (is_staff());

-- 2. Allow all staff (admin & employee) to insert (INSERT) expenses
CREATE POLICY "staff_insert_expenses"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (is_staff());

-- 3. Allow only admins to update (UPDATE) expenses
CREATE POLICY "admin_update_expenses"
ON public.expenses
FOR UPDATE
TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

-- 4. Allow only admins to delete (DELETE) expenses
CREATE POLICY "admin_delete_expenses"
ON public.expenses
FOR DELETE
TO authenticated
USING (get_user_role() = 'admin');
