-- ============================================================
-- Capsule — Migration 0002 : Sécurité RPC + Trigger complet
-- ============================================================

-- ============================================================
-- 1. RPC: accept_ticket
--    Seul le to_user peut accepter un ticket pending → active
-- ============================================================
create or replace function public.accept_ticket(ticket_uuid uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.tickets
    where id = ticket_uuid
      and to_user = auth.uid()
      and status = 'pending'
  ) then
    raise exception 'Action non autorisée ou ticket non éligible';
  end if;

  update public.tickets
  set status = 'active'
  where id = ticket_uuid and status = 'pending';
end;
$$ language plpgsql security definer;

-- ============================================================
-- 2. RPC: pay_ticket
--    from_user ou to_user peut passer active → paid
-- ============================================================
create or replace function public.pay_ticket(ticket_uuid uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.tickets
    where id = ticket_uuid
      and (from_user = auth.uid() or to_user = auth.uid())
      and status = 'active'
  ) then
    raise exception 'Action non autorisée ou ticket non éligible';
  end if;

  update public.tickets
  set status = 'paid'
  where id = ticket_uuid and status = 'active';
end;
$$ language plpgsql security definer;

-- ============================================================
-- 3. Révoquer la policy UPDATE sur tickets
--    Les updates passent désormais par les RPC sécurisés
--    On garde seulement un update restreint pour from_user
--    (modification du motif sur ticket pending uniquement)
-- ============================================================
drop policy if exists "tickets_update_participants" on public.tickets;

create policy "tickets_update_motif_pending"
  on public.tickets for update to authenticated
  using (auth.uid() = from_user and status = 'pending')
  with check (auth.uid() = from_user and status = 'pending');

-- ============================================================
-- 4. Trigger: recalculate_solde — version complète
--    Gère INSERT, UPDATE (toutes transitions) et DELETE
-- ============================================================
create or replace function public.recalculate_solde()
returns trigger as $$
begin
  -- INSERT: seul 'active' impacte le solde (cas rare, ticket créé directement actif)
  if (tg_op = 'INSERT' and new.status = 'active') then
    update public.profiles set solde_global = solde_global - 1 where id = new.from_user;
    update public.profiles set solde_global = solde_global + 1 where id = new.to_user;

  -- UPDATE: pending → active (acceptation)
  elsif (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active') then
    update public.profiles set solde_global = solde_global - 1 where id = new.from_user;
    update public.profiles set solde_global = solde_global + 1 where id = new.to_user;

  -- UPDATE: active → paid (décapsulage)
  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'paid') then
    update public.profiles set solde_global = solde_global + 1 where id = new.from_user;
    update public.profiles set solde_global = solde_global - 1 where id = new.to_user;

  -- UPDATE: active → pending (rollback, refuse après acceptation)
  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'pending') then
    update public.profiles set solde_global = solde_global + 1 where id = new.from_user;
    update public.profiles set solde_global = solde_global - 1 where id = new.to_user;

  -- UPDATE: pending → paid (transition illégale, bloquer)
  elsif (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'paid') then
    raise exception 'Transition illégale: pending → paid. Utiliser accept_ticket puis pay_ticket.';

  -- UPDATE: paid → anything (bloquer, un ticket paid est définitif)
  elsif (tg_op = 'UPDATE' and old.status = 'paid') then
    raise exception 'Transition illégale: un ticket payé ne peut pas être modifié.';

  end if;

  -- DELETE: reverse le solde si le ticket était 'active'
  if (tg_op = 'DELETE') then
    if (old.status = 'active') then
      update public.profiles set solde_global = solde_global + 1 where id = old.from_user;
      update public.profiles set solde_global = solde_global - 1 where id = old.to_user;
    end if;
    -- Si pending ou paid: pas d'impact sur le solde
  end if;

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Recréer le trigger pour INSERT, UPDATE et DELETE
drop trigger if exists trg_recalculate_solde on public.tickets;
create trigger trg_recalculate_solde
  after insert or update or delete on public.tickets
  for each row execute function public.recalculate_solde();
