
-- Enable RLS (no-op if already enabled)
alter table if exists public.orders enable row level security;
alter table if exists public.order_items enable row level security;

-- Allow anonymous users to insert orders
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'anon_insert_orders') then
    create policy "anon_insert_orders"
      on public.orders
      for insert
      to anon
      with check (true);
  end if;
end
$$;

-- Allow anonymous users to select orders (needed for INSERT ... RETURNING)
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'anon_select_orders') then
    create policy "anon_select_orders"
      on public.orders
      for select
      to anon
      using (true);
  end if;
end
$$;

-- Allow anonymous users to insert order_items linked to any existing order
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'anon_insert_order_items') then
    create policy "anon_insert_order_items"
      on public.order_items
      for insert
      to anon
      with check (exists (select 1 from public.orders o where o.id = order_id));
  end if;
end
$$;

-- Optional: allow reading order_items for linked orders
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'anon_select_order_items') then
    create policy "anon_select_order_items"
      on public.order_items
      for select
      to anon
      using (exists (select 1 from public.orders o where o.id = order_id));
  end if;
end
$$;
