-- IN4MIND — El autor de un mensaje lo decide el servidor, no el cliente
--
-- La RLS ya impedía publicar con el `user_id` de otra persona, pero
-- `author_name` y `author_level` llegaban como texto libre desde el navegador.
-- Bastaba con llamar a la API REST de Supabase con el token propio y un
-- `author_name` cualquiera para que el mensaje apareciera firmado como
-- "Administrador", "Soporte IN4MIND" o el nombre de otro usuario: la
-- suplantación era visual, que es justo lo que importa en un chat.
--
-- A partir de aquí ambos campos se derivan en un trigger BEFORE INSERT a
-- partir de `profiles`, buscando por `auth.uid()`. Lo que mande el cliente se
-- descarta siempre, así que da igual por qué vía llegue la inserción.

-- ── Nivel de gamificación ───────────────────────────────────────────────────
-- No existía en el servidor: el nivel vivía solo en el dispositivo. Para poder
-- derivar la insignia sin aceptar el valor en cada mensaje, se guarda en el
-- perfil. Cada quien solo puede escribir el suyo (RLS de `profiles`), y el
-- rango acotado evita un "nivel 9999" decorativo.
alter table public.profiles
  add column if not exists level integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_level_range'
  ) then
    alter table public.profiles
      add constraint profiles_level_range check (level between 1 and 999);
  end if;
end $$;

-- ── Derivación del autor ────────────────────────────────────────────────────
create or replace function public.chat_messages_set_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid          uuid := auth.uid();
  profile_name text;
  profile_lvl  integer;
  fallback     text;
begin
  -- Sin sesión no se publica. La RLS ya lo impide para el rol `authenticated`,
  -- pero el trigger no debe depender de que la política siga ahí mañana.
  if uid is null then
    raise exception 'unauthenticated'
      using hint = 'Inicia sesión para escribir en el chat.';
  end if;

  -- El autor es siempre quien inserta, venga lo que venga en la fila.
  new.user_id := uid;

  select p.name, p.level
    into profile_name, profile_lvl
    from public.profiles p
   where p.id = uid;

  -- Un perfil recién creado puede no tener nombre todavía; se recurre al
  -- correo de auth antes de rendirse, para no firmar como "Usuario".
  if profile_name is null or btrim(profile_name) = '' then
    select split_part(u.email, '@', 1) into fallback
      from auth.users u
     where u.id = uid;
    profile_name := nullif(btrim(coalesce(fallback, '')), '');
  end if;

  new.author_name  := left(coalesce(profile_name, 'Usuario'), 80);
  new.author_level := greatest(1, least(coalesce(profile_lvl, 1), 999));

  return new;
end;
$$;

-- Orden de los triggers BEFORE: PostgreSQL los ejecuta por orden alfabético
-- del nombre, no por orden de creación. Esto importa porque el limitador de
-- frecuencia agrupa por `new.user_id`: si corriera primero, un cliente podría
-- esquivarlo enviando un `user_id` inventado (el trigger del autor lo corrige
-- después, y la comprobación de RLS se evalúa sobre la fila ya final, así que
-- la inserción se aceptaría igualmente).
--
-- Con `chat_messages_rate_limit_trg` y `chat_messages_set_author_trg` el orden
-- sería precisamente el equivocado ('r' < 's'), así que ambos se renombran con
-- un prefijo numérico que fija la secuencia de forma explícita.
drop trigger if exists chat_messages_set_author_trg on public.chat_messages;
drop trigger if exists chat_messages_rate_limit_trg on public.chat_messages;

create trigger chat_messages_01_set_author_trg
  before insert on public.chat_messages
  for each row execute function public.chat_messages_set_author();

create trigger chat_messages_02_rate_limit_trg
  before insert on public.chat_messages
  for each row execute function public.chat_messages_rate_limit();

-- ── Mensajes ya publicados ──────────────────────────────────────────────────
-- Cualquier nombre falsificado antes de esta migración sigue en la tabla; se
-- realinea con el perfil real de cada autor.
update public.chat_messages m
   set author_name = left(coalesce(nullif(btrim(p.name), ''), 'Usuario'), 80)
  from public.profiles p
 where p.id = m.user_id
   and m.author_name is distinct from left(coalesce(nullif(btrim(p.name), ''), 'Usuario'), 80);
