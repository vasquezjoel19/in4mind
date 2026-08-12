-- IN4MIND — Sync de blobs de usuario (notas, proyectos, intentos, guiados)
-- Tablas genéricas JSONB + RLS por auth.uid()

create table if not exists public.user_notes (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  blob       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_projects (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  blob       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  blob       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.guided_progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  blob       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_notes enable row level security;
alter table public.user_projects enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.guided_progress enable row level security;

-- user_notes
drop policy if exists user_notes_select on public.user_notes;
create policy user_notes_select on public.user_notes
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists user_notes_upsert on public.user_notes;
create policy user_notes_upsert on public.user_notes
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- user_projects
drop policy if exists user_projects_select on public.user_projects;
create policy user_projects_select on public.user_projects
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists user_projects_upsert on public.user_projects;
create policy user_projects_upsert on public.user_projects
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- quiz_attempts
drop policy if exists quiz_attempts_select on public.quiz_attempts;
create policy quiz_attempts_select on public.quiz_attempts
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists quiz_attempts_upsert on public.quiz_attempts;
create policy quiz_attempts_upsert on public.quiz_attempts
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- guided_progress
drop policy if exists guided_progress_select on public.guided_progress;
create policy guided_progress_select on public.guided_progress
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists guided_progress_upsert on public.guided_progress;
create policy guided_progress_upsert on public.guided_progress
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
