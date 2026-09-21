-- IN4MIND — El autor de cada mensaje lo decide el servidor, no el cliente
--
-- Antes `author_name` y `author_level` viajaban en el INSERT que manda el
-- navegador y la política RLS solo comprobaba `user_id = auth.uid()`. Con eso,
-- cualquier persona con sesión podía publicar firmando con el nombre de otra
-- (o como "Soporte IN4MIND") y con el nivel que quisiera: la política protegía
-- la autoría real, pero no la identidad que se muestra.
--
-- Ahora un trigger BEFORE INSERT rellena ambos campos leyendo `profiles` por
-- `auth.uid()`, y de paso fija `user_id`. Lo que mande el cliente en esas tres
-- columnas se descarta.

-- ── Nivel de gamificación en el perfil ──────────────────────────────────────
-- La gamificación vive en el dispositivo; el perfil es la única copia que el
-- servidor puede consultar al publicar. Cada quien solo puede escribir su
-- propia fila (policy `users_own_profile`), así que sigue siendo un dato que
-- el usuario controla — pero ya no se puede cambiar mensaje a mensaje ni
-- suplantar el de otra persona.
alter table public.profiles
  add column if not exists level integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_level_range'
  ) then
    alter table public.profiles
      add constraint profiles_level_range check (level between 1 and 99);
  end if;
end $$;

-- ── Trigger de identidad ────────────────────────────────────────────────────
create or replace function public.chat_messages_set_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name  text;
  profile_level integer;
  author        uuid;
begin
  author := (select auth.uid());

  if author is null then
    raise exception 'unauthenticated'
      using hint = 'Inicia sesión para publicar en el chat.';
  end if;

  -- La autoría real: ignora cualquier user_id que venga en la petición.
  new.user_id := author;

  select nullif(btrim(pr.name), ''), pr.level
    into profile_name, profile_level
    from public.profiles pr
   where pr.id = author;

  -- Perfil aún no creado (el trigger de signup corre aparte): se cae al
  -- usuario del correo, nunca a lo que mande el cliente.
  if profile_name is null then
    select nullif(split_part(us.email, '@', 1), '')
      into profile_name
      from auth.users us
     where us.id = author;
  end if;

  new.author_name  := left(coalesce(profile_name, 'Usuario'), 80);
  new.author_level := greatest(1, least(coalesce(profile_level, 1), 99));

  return new;
end;
$$;

-- El nombre importa: PostgreSQL dispara los BEFORE triggers en orden
-- alfabético y este tiene que correr ANTES que `chat_messages_rate_limit_trg`,
-- que cuenta por `user_id`. Si corriera después, bastaría con mandar un
-- user_id inventado para esquivar el límite de un mensaje por segundo.
drop trigger if exists chat_messages_author_trg on public.chat_messages;
create trigger chat_messages_author_trg
  before insert on public.chat_messages
  for each row execute function public.chat_messages_set_author();

-- Defensa en profundidad: aunque el trigger ya fija user_id, la política sigue
-- exigiendo que coincida con auth.uid().
drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert
  on public.chat_messages
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));
