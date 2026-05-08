create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  claims jsonb;
  user_role text := 'user';
  uid uuid;
begin
  uid := (event->'claims'->>'sub')::uuid;

  if uid is not null then
    select coalesce(r.name, 'user')
    into user_role
    from profiles p
    left join roles r on r.id = p.role_id
    where p.id = uid;
  end if;

    insert into public.auth_hook_debug (user_id, role)
  values (uid, user_role);
  
  claims := coalesce(event->'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role), true);

  return jsonb_set(event, '{claims}', claims, true);
end;
$$;