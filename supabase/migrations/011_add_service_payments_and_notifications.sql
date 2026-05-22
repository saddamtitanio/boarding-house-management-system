-- Add note column to service_requests
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS note TEXT;

-- Add service_request_id column to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS service_request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL;

-- Recreate payments_type_check constraint to include 'service'
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_type_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_type_check CHECK (type = ANY (ARRAY['booking'::text, 'renewal'::text, 'utility'::text, 'deposit'::text, 'fine'::text, 'service'::text]));

-- Recreate handle_successful_payment DB function
CREATE OR REPLACE FUNCTION public.handle_successful_payment(p_payment_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_booking bookings%rowtype;
  v_payment payments%rowtype;
begin
  -- Get payment
  select *
  into v_payment
  from payments
  where id = p_payment_id;

  if not found then
    raise exception 'Payment not found';
  end if;

  -- Ensure payment is paid
  if v_payment.status <> 'paid' then
    raise exception 'Payment is not paid';
  end if;

  -- If payment is for a service request, update service request status to 'in_progress'
  if v_payment.type = 'service' then
    update service_requests
    set status = 'in_progress', updated_at = now()
    where id = v_payment.service_request_id;
    return;
  end if;

  -- Get booking
  select *
  into v_booking
  from bookings
  where id = v_payment.booking_id;

  if not found then
    raise exception 'Booking not found';
  end if;

  -- Prevent duplicate lease
  if exists (
    select 1
    from leases
    where booking_id = v_booking.id
  ) then
    raise exception 'Lease already exists';
  end if;

  -- Create lease
  insert into leases (
    booking_id,
    tenant_id,
    room_id,
    start_date,
    end_date,
    status
  )
  values (
    v_booking.id,
    v_booking.tenant_id,
    v_booking.room_id,
    v_booking.start_date,
    v_booking.end_date,
    'active'
  );

  -- Update booking
  update bookings
  set status = 'completed'
  where id = v_booking.id;

  -- Update room
  update rooms
  set status = 'occupied'
  where id = v_booking.room_id;
end;
$$;

-- Recreate RLS policies on payments
DROP POLICY IF EXISTS tenant_own_payments ON public.payments;
CREATE POLICY tenant_own_payments ON public.payments FOR SELECT USING (
  (booking_id IN (SELECT bookings.id FROM public.bookings WHERE bookings.tenant_id = auth.uid()))
  OR (service_request_id IN (SELECT service_requests.id FROM public.service_requests WHERE service_requests.tenant_id = auth.uid()))
);

DROP POLICY IF EXISTS tenant_view_payments ON public.payments;
CREATE POLICY tenant_view_payments ON public.payments FOR SELECT USING (
  (booking_id IN (SELECT bookings.id FROM public.bookings WHERE bookings.tenant_id = auth.uid()))
  OR (service_request_id IN (SELECT service_requests.id FROM public.service_requests WHERE service_requests.tenant_id = auth.uid()))
  OR public.is_staff()
);

DROP POLICY IF EXISTS "allow update own payments" ON public.payments;
CREATE POLICY "allow update own payments" ON public.payments FOR UPDATE USING (
  (booking_id IN (SELECT bookings.id FROM public.bookings WHERE bookings.tenant_id = auth.uid()))
  OR (service_request_id IN (SELECT service_requests.id FROM public.service_requests WHERE service_requests.tenant_id = auth.uid()))
);

-- Recreate RLS policies on notifications
DROP POLICY IF EXISTS tenant_update_own_notifications ON public.notifications;
CREATE POLICY tenant_update_own_notifications ON public.notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS insert_notifications ON public.notifications;
CREATE POLICY insert_notifications ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_staff());

-- Add RLS policy on service_requests to let staff update them
DROP POLICY IF EXISTS staff_update_service_requests ON public.service_requests;
CREATE POLICY staff_update_service_requests ON public.service_requests
FOR UPDATE
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Allow staff to insert payments
DROP POLICY IF EXISTS staff_insert_payments ON public.payments;
CREATE POLICY staff_insert_payments ON public.payments
FOR INSERT
WITH CHECK (public.is_staff());

-- Allow staff to update payments
DROP POLICY IF EXISTS staff_update_payments ON public.payments;
CREATE POLICY staff_update_payments ON public.payments
FOR UPDATE
USING (public.is_staff())
WITH CHECK (public.is_staff());

