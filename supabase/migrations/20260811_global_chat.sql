-- IN4MIND — Chat global en tiempo real
--
-- Un único canal compartido por toda la plataforma. Los mensajes viven en
-- Postgres para poder cargar historial al abrir el chat, y Realtime los
-- reparte por `postgres_changes`, así insertar es la única escritura que hace
-- el cliente: no hay forma de emitir un mensaje que no quede guardado.

create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  -- El nivel se copia al publicar: la gamificación vive en el dispositivo de
  -- cada quien, así que sin esta foto nadie podría ver la insignia del resto.
  author_level integer not null default 1,
  body        text not null,
  -- 'text' es un mensaje normal; 'quiz' pinta la tarjeta para retar a otros.
  kind        text not null default 'text',
  -- Datos de la tarjeta de quiz: { quizId, title, url }. Nulo en los de texto.
  attachment  jsonb,
  created_at  timestamptz not null default now(),

  constraint chat_messages_body_len check (char_length(body) between 1 and 500),
  constraint chat_messages_author_len check (char_length(author_name) between 1 and 80),
  constraint chat_messages_kind check (kind in ('text', 'quiz'))
);

-- El historial siempre se pide como "los últimos N", nunca por rango.
create index if not exists chat_messages_created_at_idx
  on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

-- Lectura y escritura solo para quien ha iniciado sesión, y cada quien firma
-- con su propio user_id: no se puede publicar en nombre de otro.
drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select
  on public.chat_messages
  for select
  to authenticated
  using (true);

drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert
  on public.chat_messages
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- Borrar el propio mensaje es la única edición permitida (moderación básica).
drop policy if exists chat_messages_delete on public.chat_messages;
create policy chat_messages_delete
  on public.chat_messages
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- El cooldown del cliente evita el spam accidental, pero es trivial saltárselo
-- llamando a la API directamente. Esta comprobación es la que de verdad manda.
create or replace function public.chat_messages_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_at timestamptz;
begin
  select max(created_at) into last_at
    from public.chat_messages
   where user_id = new.user_id;

  if last_at is not null and now() - last_at < interval '1 second' then
    raise exception 'rate_limited'
      using hint = 'Espera un momento antes de enviar otro mensaje.';
  end if;

  return new;
end;
$$;

drop trigger if exists chat_messages_rate_limit_trg on public.chat_messages;
create trigger chat_messages_rate_limit_trg
  before insert on public.chat_messages
  for each row execute function public.chat_messages_rate_limit();

-- Realtime: sin esto los INSERT no llegan a los clientes suscritos.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
