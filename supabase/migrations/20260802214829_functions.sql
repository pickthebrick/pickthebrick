-- Workflow transitions as SECURITY DEFINER RPCs, so the approval chain
-- (submitted -> captain_confirmed -> admin_approved -> paid) can't be
-- short-circuited by a client/captain/admin issuing a raw UPDATE.

create or replace function public.current_role()
returns text
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.recalc_quote_totals(p_quote_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.quotes q set
    materials_total = coalesce((select sum(rate * qty) from public.quote_items where quote_id = p_quote_id), 0),
    install_total = coalesce((select sum(install_rate * qty) from public.quote_items where quote_id = p_quote_id), 0),
    grand_total = coalesce((select sum(amount) from public.quote_items where quote_id = p_quote_id), 0)
  where q.id = p_quote_id;
end;
$$;

-- Keep totals in sync automatically as a client edits their draft cart.
create or replace function public.quote_items_recalc_trigger()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_quote_totals(old.quote_id);
    return old;
  else
    perform public.recalc_quote_totals(new.quote_id);
    return new;
  end if;
end;
$$;

create trigger quote_items_after_change
  after insert or update or delete on public.quote_items
  for each row execute function public.quote_items_recalc_trigger();

create or replace function public.get_or_create_draft_quote()
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if public.current_role() <> 'client' then
    raise exception 'Only clients can build quotes';
  end if;

  select id into v_id from public.quotes where client_id = auth.uid() and status = 'draft';
  if v_id is null then
    insert into public.quotes (client_id, status) values (auth.uid(), 'draft') returning id into v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.submit_quote(p_quote_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_status text;
  v_client uuid;
  v_count int;
begin
  select status, client_id into v_status, v_client from public.quotes where id = p_quote_id for update;
  if v_client is null then
    raise exception 'Quote not found';
  end if;
  if v_client <> auth.uid() then
    raise exception 'Not your quote';
  end if;
  if v_status <> 'draft' then
    raise exception 'Quote is not in draft status';
  end if;

  select count(*) into v_count from public.quote_items where quote_id = p_quote_id;
  if v_count = 0 then
    raise exception 'Cannot submit an empty quote';
  end if;

  perform public.recalc_quote_totals(p_quote_id);
  update public.quotes set status = 'submitted', submitted_at = now() where id = p_quote_id;

  insert into public.quote_status_history (quote_id, from_status, to_status, changed_by)
  values (p_quote_id, v_status, 'submitted', auth.uid());
end;
$$;

create or replace function public.captain_confirm(p_quote_id uuid, p_contractor_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_status text;
  v_contractor_role text;
begin
  if public.current_role() <> 'captain' then
    raise exception 'Only a captain can confirm a quote';
  end if;

  select role into v_contractor_role from public.profiles where id = p_contractor_id;
  if v_contractor_role is distinct from 'contractor' then
    raise exception 'contractor_id must reference a contractor profile';
  end if;

  select status into v_status from public.quotes where id = p_quote_id for update;
  if v_status is null then
    raise exception 'Quote not found';
  end if;
  if v_status <> 'submitted' then
    raise exception 'Quote must be submitted before it can be confirmed';
  end if;

  update public.quotes
    set status = 'captain_confirmed', captain_id = auth.uid(), contractor_id = p_contractor_id, confirmed_at = now()
    where id = p_quote_id;

  insert into public.quote_status_history (quote_id, from_status, to_status, changed_by)
  values (p_quote_id, v_status, 'captain_confirmed', auth.uid());
end;
$$;

create or replace function public.admin_approve(p_quote_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_status text;
begin
  if public.current_role() <> 'admin' then
    raise exception 'Only an admin can approve a quote';
  end if;

  select status into v_status from public.quotes where id = p_quote_id for update;
  if v_status is null then
    raise exception 'Quote not found';
  end if;
  if v_status <> 'captain_confirmed' then
    raise exception 'Quote must be captain-confirmed before admin approval';
  end if;

  update public.quotes set status = 'admin_approved', approved_at = now() where id = p_quote_id;

  insert into public.quote_status_history (quote_id, from_status, to_status, changed_by)
  values (p_quote_id, v_status, 'admin_approved', auth.uid());
end;
$$;

create or replace function public.mark_paid(p_quote_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_status text;
begin
  if public.current_role() <> 'admin' then
    raise exception 'Only an admin can mark a quote as paid';
  end if;

  select status into v_status from public.quotes where id = p_quote_id for update;
  if v_status is null then
    raise exception 'Quote not found';
  end if;
  if v_status <> 'admin_approved' then
    raise exception 'Quote must be admin-approved before it can be marked paid';
  end if;

  update public.quotes set status = 'paid', paid_at = now() where id = p_quote_id;

  insert into public.quote_status_history (quote_id, from_status, to_status, changed_by)
  values (p_quote_id, v_status, 'paid', auth.uid());
end;
$$;

grant execute on function public.get_or_create_draft_quote() to authenticated;
grant execute on function public.submit_quote(uuid) to authenticated;
grant execute on function public.captain_confirm(uuid, uuid) to authenticated;
grant execute on function public.admin_approve(uuid) to authenticated;
grant execute on function public.mark_paid(uuid) to authenticated;
