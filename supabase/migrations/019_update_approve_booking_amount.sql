-- Migration: Update approve_booking function to multiply amount by number of months
CREATE OR REPLACE FUNCTION public.approve_booking(p_booking_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_booking        bookings%ROWTYPE;
  v_room_price     NUMERIC;
  v_expires_at     TIMESTAMPTZ;
  v_payment_id     UUID;
  v_months         INTEGER;
  v_total_amount   NUMERIC;
BEGIN
  -- 1. Lock booking row
  SELECT *
  INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  -- 2. Booking must exist
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;

  -- 3. Only pending bookings can be approved
  IF v_booking.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only pending bookings can be approved'
    );
  END IF;

  -- 4. Get room price
  SELECT price
  INTO v_room_price
  FROM rooms
  WHERE id = v_booking.room_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Room not found'
    );
  END IF;

  -- Calculate number of months between start_date and end_date
  v_months := EXTRACT(YEAR FROM age(v_booking.end_date, v_booking.start_date)) * 12 + EXTRACT(MONTH FROM age(v_booking.end_date, v_booking.start_date));
  IF v_months IS NULL OR v_months < 1 THEN
    v_months := 1;
  END IF;
  v_total_amount := v_room_price * v_months;

  -- 5. Approve booking
  UPDATE bookings
  SET
    status = 'approved',
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- 6. Create pending payment
  v_expires_at := NOW() + INTERVAL '24 hours';

  INSERT INTO payments (
    booking_id,
    lease_id,
    amount,
    status,
    type,
    expires_at,
    created_at
  )
  VALUES (
    p_booking_id,
    v_booking.renewal_of_lease_id,
    v_total_amount,
    'pending',
    CASE
      WHEN v_booking.booking_type = 'renewal'
      THEN 'renewal'
      ELSE 'booking'
    END,
    v_expires_at,
    NOW()
  )
  RETURNING id INTO v_payment_id;

  -- 7. Return success
  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'payment_id', v_payment_id,
    'expires_at', v_expires_at
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
