-- RentRight database schema (safe to re-run)
-- New project: run this whole file once in Supabase SQL Editor.
-- WARNING: drop statements below wipe existing data — use only on fresh/dev DBs.

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.activities cascade;
drop table if exists public.maintenance_requests cascade;
drop table if exists public.expense_splits cascade;
drop table if exists public.expenses cascade;
drop table if exists public.documents cascade;
drop table if exists public.household_members cascade;
drop table if exists public.profiles cascade;
drop table if exists public.households cascade;

drop function if exists public.get_my_memberships() cascade;
drop function if exists public.get_my_households() cascade;
drop function if exists public.link_my_memberships() cascade;
drop function if exists public.is_household_member(uuid) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;

drop type if exists public.member_role cascade;
drop type if exists public.expense_split_mode cascade;
drop type if exists public.maintenance_status cascade;

create type public.member_role as enum ('leaseholder', 'tenant');
create type public.expense_split_mode as enum ('equal', 'percentage', 'amount');
create type public.maintenance_status as enum (
  'submitted', 'in_progress', 'resolved', 'cancelled'
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  unit text not null default '',
  address text not null check (char_length(trim(address)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) > 0),
  email text not null check (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  active_household_id uuid references public.households (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
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

create table public.expenses (
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

create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  member_id uuid not null references public.household_members (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  percentage numeric(5, 2),
  paid boolean not null default false,
  paid_at timestamptz,
  unique (expense_id, member_id)
);

create table public.documents (
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

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  category text not null default 'other',
  priority text not null default 'medium',
  status public.maintenance_status not null default 'submitted',
  submitted_by uuid not null references public.profiles (id) on delete cascade,
  submitted_by_member_id uuid references public.household_members (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  actor_member_id uuid references public.household_members (id) on delete set null,
  activity_type text not null check (char_length(trim(activity_type)) > 0),
  description text not null check (char_length(trim(description)) > 0),
  related_entity_type text not null default '',
  related_entity_id uuid,
  created_at timestamptz not null default now()
);

create unique index profiles_email_lower_uidx on public.profiles (lower(email));
create index profiles_active_household_id_idx on public.profiles (active_household_id);

create unique index household_members_user_household_uidx
  on public.household_members (user_id, household_id) where user_id is not null;
create index household_members_household_id_idx on public.household_members (household_id);
create index household_members_user_id_idx on public.household_members (user_id);

create index expenses_household_id_idx on public.expenses (household_id);
create index expenses_expense_date_idx on public.expenses (expense_date desc);
create index expense_splits_expense_id_idx on public.expense_splits (expense_id);

create index documents_household_id_idx on public.documents (household_id);

create index maintenance_requests_household_id_idx on public.maintenance_requests (household_id);
create index maintenance_requests_created_at_idx on public.maintenance_requests (created_at desc);

create index activities_household_id_idx on public.activities (household_id);
create index activities_created_at_idx on public.activities (created_at desc);

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.handle_new_user()
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

create function public.is_household_member(target_household_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = target_household_id
      and (
        m.user_id = auth.uid()
        or (
          auth.jwt() ->> 'email' is not null
          and lower(m.email) = lower(auth.jwt() ->> 'email')
        )
      )
  );
$$;

create function public.get_my_memberships()
returns table (
  id uuid,
  household_id uuid,
  user_id uuid,
  name text,
  email text,
  phone text,
  role text
)
language sql stable security definer set search_path = public as $$
  select m.id, m.household_id, m.user_id, m.name, m.email, m.phone, m.role::text
  from public.household_members m
  where m.user_id = auth.uid()
     or (
       auth.jwt() ->> 'email' is not null
       and lower(m.email) = lower(auth.jwt() ->> 'email')
     );
$$;

create function public.get_my_households()
returns table (
  id uuid,
  name text,
  unit text,
  address text
)
language sql stable security definer set search_path = public as $$
  select h.id, h.name, h.unit, h.address
  from public.households h
  where exists (
    select 1 from public.household_members m
    where m.household_id = h.id
      and (
        m.user_id = auth.uid()
        or (
          auth.jwt() ->> 'email' is not null
          and lower(m.email) = lower(auth.jwt() ->> 'email')
        )
      )
  )
  order by h.name;
$$;

create function public.link_my_memberships()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  updated_count integer;
  my_email text;
begin
  my_email := lower(nullif(trim(auth.jwt() ->> 'email'), ''));

  update public.household_members m
  set user_id = auth.uid(),
      updated_at = now()
  where my_email is not null
    and lower(m.email) = my_email
    and m.user_id is distinct from auth.uid();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.is_household_member(uuid) from public, anon;
revoke all on function public.get_my_memberships() from public, anon;
revoke all on function public.get_my_households() from public, anon;
revoke all on function public.link_my_memberships() from public, anon;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.get_my_memberships() to authenticated;
grant execute on function public.get_my_households() to authenticated;
grant execute on function public.link_my_memberships() to authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger households_set_updated_at before update on public.households
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger household_members_set_updated_at before update on public.household_members
  for each row execute function public.set_updated_at();

create trigger expenses_set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

create trigger documents_set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

create trigger maintenance_requests_set_updated_at before update on public.maintenance_requests
  for each row execute function public.set_updated_at();

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.documents enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.activities enable row level security;

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
  for select to authenticated using (
    user_id = auth.uid()
    or (
      auth.jwt() ->> 'email' is not null
      and lower(email) = lower(auth.jwt() ->> 'email')
    )
    or public.is_household_member(household_id)
  );
create policy household_members_insert on public.household_members
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_household_member(household_id));
create policy household_members_update_own on public.household_members
  for update to authenticated
  using (
    user_id = auth.uid()
    or public.is_household_member(household_id)
    or (
      user_id is null
      and auth.jwt() ->> 'email' is not null
      and lower(email) = lower(auth.jwt() ->> 'email')
    )
  )
  with check (
    user_id = auth.uid()
    or public.is_household_member(household_id)
  );

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

create policy maintenance_requests_select_member on public.maintenance_requests
  for select to authenticated using (public.is_household_member(household_id));
create policy maintenance_requests_insert_member on public.maintenance_requests
  for insert to authenticated with check (public.is_household_member(household_id));
create policy maintenance_requests_update_member on public.maintenance_requests
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy maintenance_requests_delete_member on public.maintenance_requests
  for delete to authenticated using (public.is_household_member(household_id));

create policy activities_select_member on public.activities
  for select to authenticated using (public.is_household_member(household_id));
create policy activities_insert_member on public.activities
  for insert to authenticated with check (public.is_household_member(household_id));

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.households,
  public.profiles,
  public.household_members,
  public.expenses,
  public.expense_splits,
  public.documents,
  public.maintenance_requests,
  public.activities
to authenticated;

insert into public.profiles (id, display_name, email)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
    split_part(u.email, '@', 1)
  ),
  lower(trim(u.email))
from auth.users u
on conflict (id) do update
  set display_name = excluded.display_name,
      email = excluded.email,
      updated_at = now();

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

select proname as installed_function
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('is_household_member', 'get_my_memberships', 'get_my_households', 'link_my_memberships')
order by proname;
