-- IN4MIND — post-signup onboarding fields on profiles
alter table public.profiles
  add column if not exists onboarding_completed boolean default false;

alter table public.profiles
  add column if not exists learning_goal text;

alter table public.profiles
  add column if not exists learning_path_id text;
