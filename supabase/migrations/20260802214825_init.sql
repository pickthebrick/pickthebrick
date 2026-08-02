-- PickTheBrick core schema: profiles/roles, catalog (category -> type -> subtype -> product),
-- and the quote/approval workflow (draft -> submitted -> captain_confirmed -> admin_approved -> paid).

-- ==========================================================================
-- profiles (one row per auth.users row; role drives access throughout)
-- ==========================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client','captain','contractor','admin')),
  full_name text,
  company text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Populate a profile automatically whenever someone signs up (email/password or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant select, update on public.profiles to authenticated;
-- Nobody can self-promote: role can only change via a manual Studio edit (or a future admin-only RPC).
revoke update (role) on public.profiles from authenticated;

create policy "profiles_select" on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role in ('captain','admin'))
  );

create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid());

-- ==========================================================================
-- Catalog: category -> type -> subtype -> product, each with sort_order.
-- Read-only to the app (authenticated users can browse); writes happen via
-- Supabase Studio / the seed script for now, not through the app.
-- ==========================================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  subtitle text,
  unit text not null check (unit in ('sqm','lm','count')),
  highlight text,
  enabled boolean not null default true,
  sort_order int not null default 0
);

create table public.types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  key text not null,
  label text not null,
  sort_order int not null default 0,
  unique (category_id, key)
);

create table public.subtypes (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references public.types(id) on delete cascade,
  key text not null,
  label text not null,
  sort_order int not null default 0,
  unique (type_id, key)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  subtype_id uuid not null references public.subtypes(id) on delete cascade,
  name text not null,
  rate numeric(12,2) not null,
  install_rate numeric(12,2) not null default 0,
  sort_order int not null default 0
);

create index types_category_id_idx on public.types (category_id);
create index subtypes_type_id_idx on public.subtypes (type_id);
create index products_subtype_id_idx on public.products (subtype_id);

alter table public.categories enable row level security;
alter table public.types enable row level security;
alter table public.subtypes enable row level security;
alter table public.products enable row level security;

grant select on public.categories, public.types, public.subtypes, public.products to authenticated;

create policy "categories_select" on public.categories for select to authenticated using (true);
create policy "types_select" on public.types for select to authenticated using (true);
create policy "subtypes_select" on public.subtypes for select to authenticated using (true);
create policy "products_select" on public.products for select to authenticated using (true);

-- ==========================================================================
-- Quotes: the Client's cart (status = 'draft') through the approval chain.
-- Status transitions themselves are RPC-only (see the functions migration) --
-- direct grants below only cover the "select" surface plus quote_items writes
-- while a quote is still a draft.
-- ==========================================================================
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  status text not null default 'draft' check (status in ('draft','submitted','captain_confirmed','admin_approved','paid')),
  captain_id uuid references public.profiles(id),
  contractor_id uuid references public.profiles(id),
  materials_total numeric(14,2) not null default 0,
  install_total numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  confirmed_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz
);

-- Only one active draft per client at a time.
create unique index quotes_one_draft_per_client on public.quotes (client_id) where (status = 'draft');
create index quotes_client_id_idx on public.quotes (client_id);
create index quotes_contractor_id_idx on public.quotes (contractor_id);
create index quotes_status_idx on public.quotes (status);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id),
  name text not null,
  category_label text not null,
  type_label text not null,
  subtype_label text not null,
  rate numeric(12,2) not null,
  install_rate numeric(12,2) not null default 0,
  unit text not null check (unit in ('sqm','lm','count')),
  qty numeric(12,2) not null check (qty > 0),
  amount numeric(14,2) generated always as ((rate + install_rate) * qty) stored,
  created_at timestamptz not null default now(),
  unique (quote_id, product_id)
);

create index quote_items_quote_id_idx on public.quote_items (quote_id);

create table public.quote_status_history (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now()
);

create index quote_status_history_quote_id_idx on public.quote_status_history (quote_id);

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_status_history enable row level security;

grant select on public.quotes to authenticated;
grant select, insert, update, delete on public.quote_items to authenticated;
grant select on public.quote_status_history to authenticated;

create policy "quotes_select" on public.quotes for select to authenticated
  using (
    client_id = auth.uid()
    or contractor_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('captain','admin'))
  );

create policy "quote_items_select" on public.quote_items for select to authenticated
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_items.quote_id
        and (
          q.client_id = auth.uid()
          or q.contractor_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('captain','admin'))
        )
    )
  );

-- A client may only add/edit/remove line items on their own quote while it is still a draft.
create policy "quote_items_client_write" on public.quote_items for all to authenticated
  using (
    exists (select 1 from public.quotes q where q.id = quote_items.quote_id and q.client_id = auth.uid() and q.status = 'draft')
  )
  with check (
    exists (select 1 from public.quotes q where q.id = quote_items.quote_id and q.client_id = auth.uid() and q.status = 'draft')
  );

create policy "quote_status_history_select" on public.quote_status_history for select to authenticated
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_status_history.quote_id
        and (
          q.client_id = auth.uid()
          or q.contractor_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('captain','admin'))
        )
    )
  );
