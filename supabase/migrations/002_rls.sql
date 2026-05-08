CREATE EXTENSION IF NOT EXISTS btree_gist;

-- PROFILES
DROP POLICY IF EXISTS "own_profile" ON profiles;

-- PAYMENTS
DROP POLICY IF EXISTS "tenant_view_payments" ON payments;

-- ROOMS
DROP POLICY IF EXISTS "admin_insert_rooms" ON rooms;
DROP POLICY IF EXISTS "admin_update_rooms" ON rooms;
DROP POLICY IF EXISTS "admin_delete_rooms" ON rooms;
DROP POLICY IF EXISTS "view_rooms" ON rooms;

-- SERVICES
DROP POLICY IF EXISTS "admin_manage_services" ON services;
DROP POLICY IF EXISTS "admin_update_services" ON services;
DROP POLICY IF EXISTS "admin_delete_services" ON services;

-- SERVICE REQUESTS
DROP POLICY IF EXISTS "admin_service_requests" ON service_requests;
DROP POLICY IF EXISTS "service_requests_access" ON service_requests;
DROP POLICY IF EXISTS "tenant_create_service_request" ON service_requests;

-- BOOKINGS
DROP POLICY IF EXISTS "tenant_create_booking" ON bookings;
DROP POLICY IF EXISTS "bookings_access" ON bookings;
DROP POLICY IF EXISTS "staff_update_bookings" ON bookings;
DROP POLICY IF EXISTS "staff_delete_bookings" ON bookings;

-- CONVERSATIONS
DROP POLICY IF EXISTS "own_conversations" ON conversations;

-- EXPENSES
DROP POLICY IF EXISTS "staff_expenses" ON expenses;

-- NOTIFICATIONS
DROP POLICY IF EXISTS "own_notifications" ON notifications;

-- FEEDBACK
DROP POLICY IF EXISTS "tenant_feedback_insert" ON feedback;
DROP POLICY IF EXISTS "feedback_view" ON feedback;

-- MESSAGES
DROP POLICY IF EXISTS "messages_access" ON messages;

-- No two rows can exist where the room is the same and the booking dates overlap
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS no_overlapping_booking;

ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_booking
EXCLUDE USING gist (
    room_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
);

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM profiles p
  JOIN roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT get_user_role() IN ('admin', 'employee')
$$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"
ON profiles
FOR SELECT
USING (id = auth.uid());

-- Tenants can only see their payment history
CREATE POLICY "tenant_view_payments"
ON payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = payments.booking_id
    AND b.tenant_id = auth.uid()
  )
  OR is_staff()
);

-- Only admins can insert rooms
CREATE POLICY "admin_insert_rooms"
ON rooms
FOR INSERT
TO authenticated
WITH CHECK (get_user_role() = 'admin');

-- Only admins can update rooms
CREATE POLICY "admin_update_rooms"
ON rooms
FOR UPDATE
TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

-- Only admins can delete rooms
CREATE POLICY "admin_delete_rooms"
ON rooms
FOR DELETE
TO authenticated
USING (get_user_role() = 'admin');

-- Only admins creates / deletes services
CREATE POLICY "admin_manage_services"
ON services
FOR INSERT
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "admin_update_services"
ON services
FOR UPDATE
USING (get_user_role() = 'admin');

CREATE POLICY "admin_delete_services"
ON services
FOR DELETE
USING (get_user_role() = 'admin');

CREATE POLICY "admin_service_requests"
ON service_requests
FOR ALL
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "service_requests_access"
ON service_requests
FOR SELECT
USING (
  tenant_id = auth.uid()
  OR is_staff()
);

-- Tenant can create service requests
CREATE POLICY "tenant_create_service_request"
ON service_requests
FOR INSERT
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "tenant_create_booking"
ON bookings
FOR INSERT
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "bookings_access"
ON bookings
FOR SELECT
USING (
  tenant_id = auth.uid()
  OR is_staff()
);

CREATE POLICY "staff_update_bookings"
ON bookings
FOR UPDATE
USING (is_staff())
WITH CHECK (is_staff());

CREATE POLICY "staff_delete_bookings"
ON bookings
FOR DELETE
USING (is_staff());

CREATE OR REPLACE FUNCTION restrict_employee_service_update()
RETURNS TRIGGER AS $$
BEGIN

  IF get_user_role() = 'employee' THEN
    IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id OR
        NEW.service_id IS DISTINCT FROM OLD.service_id OR
        NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN

        RAISE EXCEPTION 'Employees can only update status/progress';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_request_update_guard
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION restrict_employee_service_update();

CREATE POLICY "view_rooms"
ON rooms
FOR SELECT
USING (
  status = 'vacant'
  OR is_staff()
);

-- Users can only see conversations they're part of
CREATE POLICY "own_conversations"
ON conversations
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM conversation_participants cp
        WHERE cp.conversation_id = conversations.id
        AND cp.profile_id = auth.uid()
    )
);
CREATE POLICY "staff_expenses"
ON expenses
FOR ALL
USING (is_staff())
WITH CHECK (is_staff());

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_to UUID REFERENCES profiles(id);

ALTER TABLE service_requests ADD COLUMN assigned_to UUID REFERENCES profiles(id);
ALTER TABLE service_requests ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

CREATE POLICY "own_notifications"
ON notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "tenant_feedback_insert"
ON feedback
FOR INSERT
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "feedback_view"
ON feedback
FOR SELECT
USING (
  tenant_id = auth.uid()
  OR is_staff()
);

CREATE POLICY "messages_access"
ON messages
FOR SELECT
USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.profile_id = auth.uid()
    )
    OR is_staff()
);

-- BOOKINGS
CREATE INDEX idx_bookings_tenant ON bookings (tenant_id);
CREATE INDEX idx_bookings_room_dates ON bookings (room_id, start_date, end_date);

-- PAYMENTS
CREATE INDEX idx_payments_booking ON payments (booking_id);

-- SERVICE REQUESTS
CREATE INDEX idx_service_requests_tenant ON service_requests (tenant_id);
CREATE INDEX idx_service_requests_staff ON service_requests (assigned_to, status);

-- MESSAGES
CREATE INDEX idx_messages_conversation_time ON messages (conversation_id, created_at);

-- CONVERSATIONS
CREATE INDEX idx_cp_profile ON conversation_participants (profile_id, conversation_id);

-- NOTIFICATIONS
CREATE INDEX idx_notifications_user ON notifications (user_id);

-- FEEDBACK
CREATE INDEX idx_feedback_tenant ON feedback (tenant_id);

-- PROFILES
CREATE INDEX idx_profiles_role ON profiles (role_id);

-- INVOICES
CREATE INDEX idx_invoices_issued_to ON invoices (issued_to);