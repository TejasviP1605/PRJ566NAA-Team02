alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists address text not null default '';
alter table public.profiles add column if not exists address_details jsonb;

drop policy if exists households_update_member on public.households;
create policy households_update_member on public.households
  for update to authenticated using (public.is_household_member(id)) with check (public.is_household_member(id));

drop policy if exists households_delete_member on public.households;
create policy households_delete_member on public.households
  for delete to authenticated using (public.is_household_member(id));

drop policy if exists household_members_delete_member on public.household_members;
create policy household_members_delete_member on public.household_members
  for delete to authenticated using (public.is_household_member(household_id));

grant select, insert, update, delete on public.household_members to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.maintenance_requests to authenticated;
grant select, insert, update, delete on public.activities to authenticated;

create or replace function public.remove_household_member(p_member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.household_members%rowtype;
  fallback_id uuid;
  member_count integer;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'message', 'Not authenticated.');
  end if;

  select * into target
  from public.household_members
  where id = p_member_id;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Member not found.');
  end if;

  if not public.is_household_member(target.household_id) then
    return jsonb_build_object('ok', false, 'message', 'You are not allowed to modify this household.');
  end if;

  select count(*)::integer into member_count
  from public.household_members
  where household_id = target.household_id;

  if member_count <= 1 then
    return jsonb_build_object('ok', false, 'message', 'Cannot remove the last member. Delete the household instead.');
  end if;

  select id into fallback_id
  from public.household_members
  where household_id = target.household_id
    and id is distinct from p_member_id
  order by created_at asc
  limit 1;

  if fallback_id is null then
    return jsonb_build_object('ok', false, 'message', 'Cannot remove the last member. Delete the household instead.');
  end if;

  update public.expenses
  set paid_by_member_id = fallback_id,
      updated_at = now()
  where household_id = target.household_id
    and paid_by_member_id = p_member_id;

  update public.maintenance_requests
  set submitted_by_member_id = null,
      updated_at = now()
  where household_id = target.household_id
    and submitted_by_member_id = p_member_id;

  update public.activities
  set actor_member_id = null
  where household_id = target.household_id
    and actor_member_id = p_member_id;

  delete from public.expense_splits where member_id = p_member_id;

  delete from public.household_members where id = p_member_id;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Member was not deleted.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'message', 'Member removed.',
    'name', target.name,
    'household_id', target.household_id
  );
end;
$$;

revoke all on function public.remove_household_member(uuid) from public, anon;
grant execute on function public.remove_household_member(uuid) to authenticated;
