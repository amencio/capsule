-- ============================================================
-- Capsule — Migration 0003 : Refonte tickets → capsules
-- Ordre correct : drop triggers → drop constraint → update data → rename
-- ============================================================

-- 1. Drop old triggers FIRST (avoid "ticket payé ne peut pas être modifié")
drop trigger if exists trg_recalculate_solde on public.tickets;
drop trigger if exists trg_tickets_updated_at on public.tickets;

-- 2. Drop old constraint
alter table public.tickets drop constraint if exists tickets_status_check;

-- 3. Update data: 'paid' → 'resolved'
update public.tickets set status = 'resolved' where status = 'paid';

-- 4. Add new constraint
alter table public.tickets add constraint capsules_status_check
  check (status in ('pending', 'active', 'resolved'));

-- 5. Rename table
alter table public.tickets rename to capsules;

-- 6. Rename columns
alter table public.capsules rename column from_user to creditor_id;
alter table public.capsules rename column to_user to debtor_id;
alter table public.capsules rename column motif to reason;

-- 7. Add new columns
alter table public.capsules add column if not exists drink_type text;
alter table public.capsules add column if not exists amount integer not null default 1;
alter table public.capsules add column if not exists resolved_at timestamptz;

-- 8. Rename indexes
drop index if exists idx_tickets_from_user;
drop index if exists idx_tickets_to_user;
drop index if exists idx_tickets_status;
create index if not exists idx_capsules_creditor on public.capsules(creditor_id);
create index if not exists idx_capsules_debtor on public.capsules(debtor_id);
create index if not exists idx_capsules_status on public.capsules(status);

-- 9. New trigger function (new column names + amount weighting + resolved_at)
create or replace function public.recalculate_solde()
returns trigger as $$
begin
  if (tg_op = 'INSERT' and new.status = 'active') then
    update public.profiles set solde_global = solde_global - new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global + new.amount where id = new.debtor_id;

  elsif (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active') then
    update public.profiles set solde_global = solde_global - new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global + new.amount where id = new.debtor_id;

  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'resolved') then
    update public.profiles set solde_global = solde_global + new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global - new.amount where id = new.debtor_id;
    new.resolved_at = now();

  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'pending') then
    update public.profiles set solde_global = solde_global + new.amount where id = new.creditor_id;
    update public.profiles set solde_global = solde_global - new.amount where id = new.debtor_id;

  elsif (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'resolved') then
    raise exception 'Transition illegale: pending -> resolved';

  elsif (tg_op = 'UPDATE' and old.status = 'resolved') then
    raise exception 'Transition illegale: capsule resolue immuable';
  end if;

  if (tg_op = 'DELETE') then
    if (old.status = 'active') then
      update public.profiles set solde_global = solde_global + old.amount where id = old.creditor_id;
      update public.profiles set solde_global = solde_global - old.amount where id = old.debtor_id;
    end if;
    return old;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 10. Create new triggers
create trigger trg_capsules_updated_at
  before update on public.capsules
  for each row execute function public.handle_updated_at();

create trigger trg_capsules_recalculate_solde
  after insert or update or delete on public.capsules
  for each row execute function public.recalculate_solde();

-- 11. Drop old RPCs, create new ones
drop function if exists public.accept_ticket(uuid);
drop function if exists public.pay_ticket(uuid);

create or replace function public.accept_capsule(capsule_uuid uuid)
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
  set status = 'active'
  where id = capsule_uuid and status = 'pending';
end;
$$ language plpgsql security definer;

create or replace function public.resolve_capsule(capsule_uuid uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.capsules
    where id = capsule_uuid
      and (creditor_id = auth.uid() or debtor_id = auth.uid())
      and status = 'active'
  ) then
    raise exception 'Action non autorisee ou capsule non eligible';
  end if;

  update public.capsules
  set status = 'resolved'
  where id = capsule_uuid and status = 'active';
end;
$$ language plpgsql security definer;

-- 12. Update RLS policies
drop policy if exists "tickets_select_participants" on public.capsules;
drop policy if exists "tickets_insert_from_user" on public.capsules;
drop policy if exists "tickets_update_motif_pending" on public.capsules;
drop policy if exists "tickets_delete_participants" on public.capsules;

create policy "capsules_select_participants" on public.capsules
  for select to authenticated
  using (auth.uid() = creditor_id or auth.uid() = debtor_id);

create policy "capsules_insert_creditor" on public.capsules
  for insert to authenticated
  with check (auth.uid() = creditor_id);

create policy "capsules_update_pending" on public.capsules
  for update to authenticated
  using (auth.uid() = creditor_id and status = 'pending')
  with check (auth.uid() = creditor_id and status = 'pending');

create policy "capsules_delete_participants" on public.capsules
  for delete to authenticated
  using (auth.uid() = creditor_id or auth.uid() = debtor_id);

-- NOTE: No "alter publication supabase_realtime" needed.
-- The table was already in the publication as "tickets",
-- and RENAME TABLE preserves publication membership.
