
-- Role enum
create type public.app_role as enum ('Admin', 'Manager', 'Technician', 'Viewer');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- has_role: security definer to avoid RLS recursion
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create policy "User roles readable by authenticated"
  on public.user_roles for select to authenticated using (true);

create policy "Admins manage user roles - insert"
  on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(), 'Admin'));

create policy "Admins manage user roles - update"
  on public.user_roles for update to authenticated
  using (public.has_role(auth.uid(), 'Admin'))
  with check (public.has_role(auth.uid(), 'Admin'));

create policy "Admins manage user roles - delete"
  on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(), 'Admin'));

-- Trigger: auto-create profile + default Viewer role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));

  insert into public.user_roles (user_id, role) values (new.id, 'Viewer');

  -- First user becomes Admin
  if (select count(*) from public.user_roles) = 1 then
    insert into public.user_roles (user_id, role) values (new.id, 'Admin')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger for profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Tighten app_state to authenticated users only
drop policy if exists "Public read app_state" on public.app_state;
drop policy if exists "Public insert app_state" on public.app_state;
drop policy if exists "Public update app_state" on public.app_state;

create policy "Authenticated read app_state"
  on public.app_state for select to authenticated using (true);
create policy "Authenticated insert app_state"
  on public.app_state for insert to authenticated with check (true);
create policy "Authenticated update app_state"
  on public.app_state for update to authenticated using (true) with check (true);
