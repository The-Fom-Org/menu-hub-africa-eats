
-- 1) Fix recursive RLS policy on admin_users
drop policy if exists "Admins can view admin users" on public.admin_users;

create policy "Users can view their own admin row"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

-- 2) Ensure the provided user is an admin
insert into public.admin_users (user_id, email, role)
select u.id, u.email, 'admin'
from auth.users u
where u.id = '4d581f34-2b6a-4ff9-93bf-58ffc184ace0'::uuid
on conflict (user_id) do update
  set email = excluded.email,
      role = excluded.role,
      updated_at = now();

-- 3) Return the row for verification
select id, user_id, email, role, created_at, updated_at
from public.admin_users
where user_id = '4d581f34-2b6a-4ff9-93bf-58ffc184ace0'::uuid;
