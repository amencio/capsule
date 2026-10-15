-- ============================================================
-- Capsule — Migration 0005 : Cockpit Pivot
-- 1. Rename pending_launch → launch_requested
-- 2. Add rejected, expired statuses
-- 3. Add expires_at, launch_requested_at, resolution columns
-- 4. New RPCs: force_launch, refuse_capsule
-- 5. Update trigger for new transitions
-- ============================================================

-- 1. Rename pending_launch → launch_requested in existing data
update public.capsules set status = 'launch_requested' where status = 'pending_launch';

-- 2. Update status constraint
alter table public.capsules drop constraint if exists capsules_status_check;
alter table public.capsules add constraint capsules_status_check
  check (status in ('pending', 'active', 'launch_requested', 'resolved', 'rejected', 'expired'));

-- 3. Add new columns
alter table public.capsules add column if not exists expires_at timestamptz;
alter table public.capsules add column if not exists launch_requested_at timestamptz;
alter table public.capsules add column if not exists resolution text
  check (resolution is null or resolution in ('validated', 'forced'));

-- 4. Backfill expires_at for existing pending capsules
update public.capsules
  set expires_at = created_at + interval '24 hours'
  where status = 'pending' and expires_at is null;

-- 5. Update recalculate_solde trigger for new transitions
create or replace function public.recalculate_solde()
returns trigger as $$
begin
  if (tg_op = 'INSERT' and new.status = 'active') then
    update public.profiles set solde_global = solde_global - new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global + new.amount where id = new.debtor_id;

  elsif (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active') then
    update public.profiles set solde_global = solde_global - new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global + new.amount where id = new.debtor_id;

  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'launch_requested') then
    null;

  elsif (tg_op = 'UPDATE' and old.status = 'launch_requested' and new.status = 'resolved') then
    update public.profiles set solde_global = solde_global + new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global - new.amount where id = new.debtor_id;
    new.resolved_at = now();

  elsif (tg_op = 'UPDATE' and old.status = 'launch_requested' and new.status = 'active') then
    null;

  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'resolved') then
    raise exception 'Transition illegale: active -> resolved. Utiliser launch_requested';

  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'pending') then
    update public.profiles set solde_global = solde_global + new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global - new.amount where id = new.debtor_id;

  elsif (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'resolved') then
    raise exception 'Transition illegale: pending -> resolved';

  elsif (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'rejected') then
    null;

  elsif (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'expired') then
    null;

  elsif (tg_op = 'UPDATE' and old.status = 'resolved') then
    raise exception 'Transition illegale: capsule resolue immuable';
  end if;

  if (tg_op = 'DELETE') then
    if (old.status = 'active' or old.status = 'launch_requested') then
      update public.profiles set solde_global = solde_global + old.amount where id = old.creditor_id;
      update public.profiles set solde_global = solde_global - old.amount where id = old.debtor_id;
    end if;
    return old;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 6. Drop old RPCs that reference pending_launch
drop function if exists public.request_launch(uuid);
drop function if exists public.authorize_launch(uuid);

-- 7. Create updated RPCs (same names, updated for launch_requested)
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
  set status = 'launch_requested', launch_requested_at = now()
  where id = capsule_uuid and status = 'active';
end;
$$ language plpgsql security definer;

create or replace function public.authorize_launch(capsule_uuid uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.capsules
    where id = capsule_uuid
      and debtor_id = auth.uid()
      and status = 'launch_requested'
  ) then
    raise exception 'Action non autorisee ou capsule non eligible';
  end if;

  update public.capsules
  set status = 'resolved', resolved_at = now(), resolution = 'validated'
  where id = capsule_uuid and status = 'launch_requested';
end;
$$ language plpgsql security definer;

-- 8. New RPC: force_launch (creditor only: launch_requested → resolved with forced marker)
create or replace function public.force_launch(capsule_uuid uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.capsules
    where id = capsule_uuid
      and creditor_id = auth.uid()
      and status = 'launch_requested'
  ) then
    raise exception 'Action non autorisee ou capsule non eligible';
  end if;

  update public.capsules
  set status = 'resolved', resolved_at = now(), resolution = 'forced'
  where id = capsule_uuid and status = 'launch_requested';
end;
$$ language plpgsql security definer;

-- 9. New RPC: refuse_capsule (debtor only: pending → rejected)
create or replace function public.refuse_capsule(capsule_uuid uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.capsules
    where id = capsule_uuid
      and debtor_id = auth.uid()
      and status = 'pending'
  ) then
    raise exception 'Action non autorisee ou capsule non eligible';
  end if;

  update public.capsules
  set status = 'rejected'
  where id = capsule_uuid and status = 'pending';
end;
$$ language plpgsql security definer;

-- 10. Update createCapsule default: set expires_at automatically
-- (Handled in application layer via computeExpiresAt())
