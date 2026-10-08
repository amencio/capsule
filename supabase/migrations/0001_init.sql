-- ============================================================
-- Capsule — Initialisation de la base de données
-- ============================================================

-- ============================================================
-- 1. Table: profiles
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  pseudo      text not null unique,
  avatar_url  text,
  solde_global integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 2. Table: tickets (capsules)
-- ============================================================
create table if not exists public.tickets (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references public.profiles(id) on delete cascade,
  to_user     uuid not null references public.profiles(id) on delete cascade,
  motif       text not null,
  status      text not null default 'pending' check (status in ('pending', 'active', 'paid')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_tickets_from_user on public.tickets(from_user);
create index idx_tickets_to_user on public.tickets(to_user);
create index idx_tickets_status on public.tickets(status);

-- ============================================================
-- 3. Trigger: updated_at auto sur tickets
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute function public.handle_updated_at();

-- ============================================================
-- 4. Trigger: auto-création de profil à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, coalesce(new.raw_user_meta_data->>'pseudo', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 5. Trigger: recalcul du solde_global lors d'un changement de statut
-- ============================================================
create or replace function public.recalculate_solde()
returns trigger as $$
begin
  -- Quand un ticket passe à 'active': from_user doit un verre à to_user
  --   → from_user perd 1 (solde -1), to_user gagne 1 (solde +1)
  -- Quand un ticket passe à 'paid': la dette est remboursée
  --   → from_user gagne 1 (solde +1), to_user perd 1 (solde -1)
  --   (inverse de l'activation)

  if (tg_op = 'INSERT' and new.status = 'active') or
     (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active') then
    update public.profiles set solde_global = solde_global - 1 where id = new.from_user;
    update public.profiles set solde_global = solde_global + 1 where id = new.to_user;

  elsif (tg_op = 'UPDATE' and old.status = 'active' and new.status = 'paid') then
    update public.profiles set solde_global = solde_global + 1 where id = new.from_user;
    update public.profiles set solde_global = solde_global - 1 where id = new.to_user;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_recalculate_solde on public.tickets;
create trigger trg_recalculate_solde
  after insert or update on public.tickets
  for each row execute function public.recalculate_solde();

-- ============================================================
-- 6. RLS (Row Level Security)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.tickets enable row level security;

-- Profiles: lecture par tous les utilisateurs authentifiés
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);

-- Profiles: mise à jour par le propriétaire uniquement
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Tickets: lecture si l'utilisateur est from_user ou to_user
drop policy if exists "tickets_select_participants" on public.tickets;
create policy "tickets_select_participants" on public.tickets
  for select to authenticated using (auth.uid() = from_user or auth.uid() = to_user);

-- Tickets: insertion par from_user uniquement
drop policy if exists "tickets_insert_from_user" on public.tickets;
create policy "tickets_insert_from_user" on public.tickets
  for insert to authenticated with check (auth.uid() = from_user);

-- Tickets: mise à jour par les participants
drop policy if exists "tickets_update_participants" on public.tickets;
create policy "tickets_update_participants" on public.tickets
  for update to authenticated
  using (auth.uid() = from_user or auth.uid() = to_user)
  with check (auth.uid() = from_user or auth.uid() = to_user);

-- Tickets: suppression par les participants
drop policy if exists "tickets_delete_participants" on public.tickets;
create policy "tickets_delete_participants" on public.tickets
  for delete to authenticated using (auth.uid() = from_user or auth.uid() = to_user);

-- ============================================================
-- 7. Realtime
-- ============================================================
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.tickets;
