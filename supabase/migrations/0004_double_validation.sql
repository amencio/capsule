-- ============================================================
-- Capsule — Migration 0004 : Double Validation (pending_launch)
-- Workflow: active → pending_launch → resolved
-- ============================================================

-- 1. Update status constraint to include pending_launch
alter table public.capsules drop constraint if exists capsules_status_check;
alter table public.capsules add constraint capsules_status_check
  check (status in ('pending', 'active', 'pending_launch', 'resolved'));

-- 2. Update recalculate_solde trigger function
--    active → pending_launch : no solde change (signal only)
--    pending_launch → resolved : apply solde (same as old active → resolved)
--    active → resolved : BLOCKED (must go through pending_launch)
create or replace function public.recalculate_solde()
returns trigger as $$
begin
  if (tg_op = 'INSERT' and new.status = 'active') then
    update public.profiles set solde_global = solde_global - new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global + new.amount where id = new.debtor_id;

  elsif (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active') then
    update public.profiles set solde_global = solde_global - new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global + new.amount where id = new.debtor_id;

  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'pending_launch') then
    -- No solde change: creditor signals intent to drink, debtor must authorize
    null;

  elsif (tg_op = 'UPDATE' and old.status = 'pending_launch' and new.status = 'resolved') then
    update public.profiles set solde_global = solde_global + new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global - new.amount where id = new.debtor_id;
    new.resolved_at = now();

  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'resolved') then
    raise exception 'Transition illegale: active -> resolved. Utiliser pending_launch';

  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'pending') then
    update public.profiles set solde_global = solde_global + new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global - new.amount where id = new.debtor_id;

  elsif (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'resolved') then
    raise exception 'Transition illegale: pending -> resolved';

  elsif (tg_op = 'UPDATE' and old.status = 'pending_launch' and new.status = 'active') then
    -- Allow cancel: creditor can abort launch request, return to active
    null;

  elsif (tg_op = 'UPDATE' and old.status = 'resolved') then
    raise exception 'Transition illegale: capsule resolue immuable';
  end if;

  if (tg_op = 'DELETE') then
    if (old.status = 'active' or old.status = 'pending_launch') then
      update public.profiles set solde_global = solde_global + old.amount where id = old.creditor_id;
      update public.profiles set solde_global = solde_global - old.amount where id = old.debtor_id;
    end if;
    return old;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 3. Drop old resolve_capsule RPC
drop function if exists public.resolve_capsule(uuid);

-- 4. Create request_launch RPC (creditor only: active → pending_launch)
create or replace function public.request_launch(capsule_uuid uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.capsules
    where id = capsule_uuid
      and creditor_id = auth.uid()
      and status = 'active'
  ) then
    raise exception 'Action non autorisee ou capsule non eligible';
  end if;

  update public.capsules
  set status = 'pending_launch'
  where id = capsule_uuid and status = 'active';
end;
$$ language plpgsql security definer;

-- 5. Create authorize_launch RPC (debtor only: pending_launch → resolved)
create or replace function public.authorize_launch(capsule_uuid uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.capsules
    where id = capsule_uuid
      and debtor_id = auth.uid()
      and status = 'pending_launch'
  ) then
    raise exception 'Action non autorisee ou capsule non eligible';
  end if;

  update public.capsules
  set status = 'resolved'
  where id = capsule_uuid and status = 'pending_launch';
end;
$$ language plpgsql security definer;

-- 6. RLS: keep existing policies, no changes needed
-- State transitions happen through security definer RPCs which bypass RLS.
-- capsules_update_pending still allows creditor to edit pending capsules directly.
