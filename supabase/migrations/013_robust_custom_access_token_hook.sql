-- Recreate custom_access_token_hook to be extremely robust and never crash GoTrue signup/login
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role text := 'user';
  uid uuid;
BEGIN
  BEGIN
    -- Safely extract and cast user UUID
    uid := (event->'claims'->>'sub')::uuid;

    IF uid IS NOT NULL THEN
      SELECT coalesce(r.name, 'user')
      INTO user_role
      from profiles p
      left join roles r on r.id = p.role_id
      where p.id = uid;
    END IF;

    -- Safely insert into debug table if it exists and is writable
    BEGIN
      INSERT INTO public.auth_hook_debug (user_id, role)
      VALUES (uid, user_role);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors in debugging inserts
    END;
    
    claims := coalesce(event->'claims', '{}'::jsonb);
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role), true);

    RETURN jsonb_set(event, '{claims}', claims, true);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to original event if any exception occurs (prevents GoTrue from crashing with null output)
    RETURN event;
  END;
END;
$$;
