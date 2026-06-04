-- Migration: Fix rooms RLS policy to allow tenants to view their own booked/occupied rooms
-- Otherwise, room details appear as "Unknown Room" in tenant payments and bookings history.

DROP POLICY IF EXISTS "view_rooms" ON public.rooms;

CREATE POLICY "view_rooms"
ON public.rooms
FOR SELECT
USING (
  status = 'vacant'
  OR is_staff()
  OR id IN (
    SELECT room_id 
    FROM public.bookings 
    WHERE bookings.tenant_id = auth.uid()
  )
);
