CREATE TABLE room_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE room_audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.audit_rooms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

  -- INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO room_audit_log (
      room_id, field, old_value, new_value, changed_by
    )
    VALUES (
      NEW.id,
      'created',
      NULL,
      row_to_json(NEW)::text,
      auth.uid()
    );
    RETURN NEW;
  END IF;

  -- UPDATE
  IF TG_OP = 'UPDATE' THEN
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      INSERT INTO room_audit_log VALUES (gen_random_uuid(), NEW.id, 'name', OLD.name, NEW.name, auth.uid(), now());
    END IF;

    IF OLD.price IS DISTINCT FROM NEW.price THEN
      INSERT INTO room_audit_log VALUES (gen_random_uuid(), NEW.id, 'price', OLD.price::text, NEW.price::text, auth.uid(), now());
    END IF;

    RETURN NEW;
  END IF;

  -- DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO room_audit_log (
      room_id, field, old_value, new_value, changed_by
    )
    VALUES (
      OLD.id,
      'deleted',
      row_to_json(OLD)::text,
      NULL,
      auth.uid()
    );
    RETURN OLD;
  END IF;

END;
$$;

DROP TRIGGER IF EXISTS rooms_audit ON rooms;

CREATE TRIGGER rooms_audit
AFTER INSERT OR UPDATE OR DELETE ON rooms
FOR EACH ROW
EXECUTE FUNCTION public.audit_rooms();
