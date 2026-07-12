create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members m
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

drop policy if exists households_select_member on public.households;
drop function if exists public.get_my_memberships();
drop function if exists public.get_my_households();
drop function if exists public.link_my_memberships();

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
language sql
stable
security definer
set search_path = public
as $$
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
language sql
stable
security definer
set search_path = public
as $$
  select h.id, h.name, h.unit, h.address
  from public.households h
  where exists (
    select 1
    from public.household_members m
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
language plpgsql
security definer
set search_path = public
as $$
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

drop policy if exists household_members_select_member on public.household_members;

create policy households_select_member on public.households
  for select to authenticated using (public.is_household_member(id));

create policy household_members_select_member on public.household_members
  for select to authenticated using (
    user_id = auth.uid()
    or (
      auth.jwt() ->> 'email' is not null
      and lower(email) = lower(auth.jwt() ->> 'email')
    )
    or public.is_household_member(household_id)
  );

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

select 'ok' as status;
