-- Upgrade handle_new_user() trigger function to parse Google/Facebook/Apple OAuth meta metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Extract names from metadata
  v_first_name := new.raw_user_meta_data->>'first_name';
  v_last_name := new.raw_user_meta_data->>'last_name';
  
  IF v_first_name IS NULL THEN
    v_first_name := new.raw_user_meta_data->>'given_name';
  END IF;
  
  IF v_last_name IS NULL THEN
    v_last_name := new.raw_user_meta_data->>'family_name';
  END IF;

  IF v_first_name IS NULL THEN
    v_full_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name');
    IF v_full_name IS NOT NULL AND position(' ' in v_full_name) > 0 THEN
      v_first_name := split_part(v_full_name, ' ', 1);
      v_last_name := substring(v_full_name from position(' ' in v_full_name) + 1);
    ELSE
      v_first_name := COALESCE(v_full_name, split_part(new.email, '@', 1));
      v_last_name := '';
    END IF;
  END IF;

  -- Insert profile linking to auth.users using correct columns and roles mapping
  INSERT INTO public.profiles (id, role_id, first_name, last_name, phone)
  VALUES (
    new.id,
    NULL,
    COALESCE(v_first_name, 'User'),
    COALESCE(v_last_name, ''),
    COALESCE(new.raw_user_meta_data->>'phone', new.phone, '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = COALESCE(profiles.phone, EXCLUDED.phone);
    
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Prevent registration failures from blocking if profile creation encounters errors
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
