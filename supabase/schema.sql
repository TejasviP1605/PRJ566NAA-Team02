-- RentRight database schema (safe to re-run)
-- New project: run this whole file once in Supabase SQL Editor.
-- Database already exists: run from "Expense split type" through "Backfill splits" only.

-- Types
do $$ begin
  create type public.member_role as enum ('leaseholder', 'tenant');
exception when duplicate_object then null;
end $$;

-- Tables
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  unit text not null default '',
  address text not null check (char_length(trim(address)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) > 0),
  email text not null check (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  active_household_id uuid references public.households (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  email text not null default '',
  phone text not null default '',
  role public.member_role not null default 'tenant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_members_contact_check check (
    char_length(trim(email)) > 0 or char_length(trim(phone)) > 0
  )
);

-- Indexes
create unique index if not exists profiles_email_lower_uidx on public.profiles (lower(email));
create unique index if not exists household_members_user_household_uidx
  on public.household_members (user_id, household_id) where user_id is not null;
create index if not exists household_members_household_id_idx on public.household_members (household_id);
create index if not exists household_members_user_id_idx on public.household_members (user_id);
create index if not exists profiles_active_household_id_idx on public.profiles (active_household_id);

-- Functions
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1)),
    lower(trim(new.email))
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = target_household_id and m.user_id = auth.uid()
  );
$$;

-- Triggers
drop trigger if exists households_set_updated_at on public.households;
create trigger households_set_updated_at before update on public.households
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists household_members_set_updated_at on public.household_members;
create trigger household_members_set_updated_at before update on public.household_members
  for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: profiles, households, members
alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists households_select_member on public.households;
drop policy if exists households_insert_authenticated on public.households;
drop policy if exists household_members_select_member on public.household_members;
drop policy if exists household_members_insert on public.household_members;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy households_select_member on public.households
  for select to authenticated using (public.is_household_member(id));
create policy households_insert_authenticated on public.households
  for insert to authenticated with check (auth.uid() is not null);
create policy household_members_select_member on public.household_members
  for select to authenticated using (public.is_household_member(household_id));
create policy household_members_insert on public.household_members
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_household_member(household_id));

-- Expense split type
do $$ begin
  create type public.expense_split_mode as enum ('equal', 'percentage', 'amount');
exception when duplicate_object then null;
end $$;

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  description text not null check (char_length(trim(description)) > 0),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null default 'other',
  expense_date date not null default current_date,
  paid_by_member_id uuid not null references public.household_members (id) on delete restrict,
  split_mode public.expense_split_mode not null default 'equal',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses
  add column if not exists split_mode public.expense_split_mode not null default 'equal';

-- Per-member split rows (paid = member settled their share)
create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  member_id uuid not null references public.household_members (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  percentage numeric(5, 2),
  paid boolean not null default false,
  paid_at timestamptz,
  unique (expense_id, member_id)
);

alter table public.expense_splits add column if not exists paid boolean not null default false;
alter table public.expense_splits add column if not exists paid_at timestamptz;

-- Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  category text not null default 'other',
  file_name text not null,
  file_path text not null,
  file_size bigint not null default 0,
  mime_type text not null default 'application/octet-stream',
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_household_id_idx on public.expenses (household_id);
create index if not exists expenses_expense_date_idx on public.expenses (expense_date desc);
create index if not exists expense_splits_expense_id_idx on public.expense_splits (expense_id);
create index if not exists documents_household_id_idx on public.documents (household_id);

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

-- RLS: expenses, splits, documents
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.documents enable row level security;

drop policy if exists expenses_select_member on public.expenses;
drop policy if exists expenses_insert_member on public.expenses;
drop policy if exists expenses_update_member on public.expenses;
drop policy if exists expenses_delete_member on public.expenses;
drop policy if exists expense_splits_select_member on public.expense_splits;
drop policy if exists expense_splits_insert_member on public.expense_splits;
drop policy if exists expense_splits_update_member on public.expense_splits;
drop policy if exists expense_splits_delete_member on public.expense_splits;
drop policy if exists documents_select_member on public.documents;
drop policy if exists documents_insert_member on public.documents;
drop policy if exists documents_delete_member on public.documents;

create policy expenses_select_member on public.expenses
  for select to authenticated using (public.is_household_member(household_id));
create policy expenses_insert_member on public.expenses
  for insert to authenticated with check (public.is_household_member(household_id));
create policy expenses_update_member on public.expenses
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy expenses_delete_member on public.expenses
  for delete to authenticated using (public.is_household_member(household_id));

create policy expense_splits_select_member on public.expense_splits
  for select to authenticated using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and public.is_household_member(e.household_id)
    )
  );
create policy expense_splits_insert_member on public.expense_splits
  for insert to authenticated with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and public.is_household_member(e.household_id)
    )
  );
create policy expense_splits_update_member on public.expense_splits
  for update to authenticated using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and public.is_household_member(e.household_id)
    )
  );
create policy expense_splits_delete_member on public.expense_splits
  for delete to authenticated using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and public.is_household_member(e.household_id)
    )
  );

create policy documents_select_member on public.documents
  for select to authenticated using (public.is_household_member(household_id));
create policy documents_insert_member on public.documents
  for insert to authenticated with check (public.is_household_member(household_id));
create policy documents_delete_member on public.documents
  for delete to authenticated using (public.is_household_member(household_id));

-- Storage bucket household-documents (10 MB)
insert into storage.buckets (id, name, public, file_size_limit)
values ('household-documents', 'household-documents', false, 10485760)
on conflict (id) do update set file_size_limit = 10485760;

drop policy if exists household_documents_select on storage.objects;
drop policy if exists household_documents_insert on storage.objects;
drop policy if exists household_documents_delete on storage.objects;

create policy household_documents_select on storage.objects
  for select to authenticated using (
    bucket_id = 'household-documents'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );
create policy household_documents_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'household-documents'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );
create policy household_documents_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'household-documents'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );

-- Backfill splits for old expenses (equal split)
insert into public.expense_splits (expense_id, member_id, amount, percentage)
select
  e.id,
  hm.id,
  round(e.amount / mc.cnt, 2),
  round(100.0 / mc.cnt, 2)
from public.expenses e
join public.household_members hm on hm.household_id = e.household_id
join (
  select household_id, count(*)::numeric as cnt
  from public.household_members
  group by household_id
) mc on mc.household_id = e.household_id
where not exists (
  select 1 from public.expense_splits es where es.expense_id = e.id
);
