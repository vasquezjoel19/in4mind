-- IN4MIND — profiles RLS with explicit WITH CHECK + signup trigger
-- Ensures new signups can create/own their profile row without RLS blocking.

alter table public.profiles enable row level security;

drop policy if exists users_own_profile on public.profiles;

create policy users_own_profile
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
