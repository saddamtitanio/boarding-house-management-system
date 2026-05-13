create table visitor_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references profiles(id),
  room_id uuid references rooms(id),
  visitor_name text not null,
  visitor_phone text,
  purpose text,
  check_in_at timestamptz default now(),
  check_out_at timestamptz,
  created_at timestamptz default now()
);

alter table visitor_logs enable row level security;

-- tenant sees their own visitor logs
create policy "tenant_own_visitor_logs" on visitor_logs
for select using (tenant_id = auth.uid());

-- management sees all
create policy "management_all_visitor_logs" on visitor_logs
for all using (get_user_role() in ('admin', 'employee'));

-- public insert for check-in
create policy "public_insert_visitor_log" on visitor_logs
for insert with check (true);

-- public update for check-out
create policy "public_update_checkout" on visitor_logs
for update using (check_out_at is null)
with check (true);