DROP TABLE IF EXISTS public.booking_audit_log;

CREATE TABLE public.booking_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.log_booking_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_audit_log (
      booking_id,
      old_status,
      new_status,
      changed_by,
      reason
    )
    VALUES (
      OLD.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      NEW.decision_reason
    );
  END IF;

  RETURN NEW;
END;
$$;
    
DROP TRIGGER IF EXISTS booking_update_audit ON bookings;

CREATE TRIGGER booking_update_audit
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION log_booking_update();