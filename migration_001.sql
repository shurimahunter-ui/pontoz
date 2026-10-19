create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  daily_hours numeric(4,2) not null default 8,     -- jornada diária
  weekly_goal_hours numeric(5,2) not null default 40, -- meta semanal
  timezone text not null default 'America/Sao_Paulo'
);

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  check (clock_out is null or clock_out > clock_in)
);

-- no máximo uma sessão aberta por usuário
create unique index one_open_entry on time_entries (user_id) where clock_out is null;
create index on time_entries (user_id, clock_in desc);

alter table profiles enable row level security;
alter table time_entries enable row level security;

create policy "own profile" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own entries" on time_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- cria o perfil automaticamente quando um usuário é criado
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user(