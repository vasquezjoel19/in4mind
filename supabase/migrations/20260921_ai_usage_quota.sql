-- IN4MIND — Cuota diaria del asistente de IA, compartida entre instancias
--
-- El proxy /api/groq/chat ya exige sesión, pero una cuenta cualquiera podía
-- llamarlo en bucle y agotar la cuota de Groq de la plataforma. El límite en
-- memoria de la función no basta: en Vercel cada instancia tiene su propio
-- estado y se pierde en cada arranque en frío. Esta tabla es el contador que
-- todas las instancias comparten.

create table if not exists public.ai_usage (
  id         bigserial primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- La consulta siempre es "cuántas llamadas de ESTE usuario desde ESTA hora".
create index if not exists ai_usage_user_time_idx
  on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

-- Cada quien ve lo suyo y solo puede añadir filas a su nombre. No hay política
-- de UPDATE ni de DELETE: sin ellas, nadie puede rebajar su propio contador
-- —que es justo lo que haría alguien que quisiera saltarse el límite—.
drop policy if exists ai_usage_select_own on public.ai_usage;
create policy ai_usage_select_own
  on public.ai_usage
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists ai_usage_insert_own on public.ai_usage;
create policy ai_usage_insert_own
  on public.ai_usage
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- Permisos explícitos, no los que Supabase concede por defecto.
--
-- Por defecto, un proyecto de Supabase otorga ALL sobre las tablas nuevas de
-- `public` a anon y authenticated, y deja que RLS filtre. Aquí interesa que la
-- imposibilidad de borrar el propio contador NO dependa solo de que existan (o
-- no) las políticas: sin el permiso de DELETE, ni siquiera un fallo de política
-- permitiría rebajarlo.
revoke all on public.ai_usage from anon, authenticated;
grant select, insert on public.ai_usage to authenticated;
-- El id es bigserial: insertar necesita también la secuencia.
grant usage, select on sequence public.ai_usage_id_seq to authenticated;

/*
 * Cuenta y registra en una sola ida y vuelta.
 *
 * SECURITY DEFINER para poder limpiar el histórico viejo (nadie tiene permiso
 * de DELETE, ni siquiera sobre sus propias filas). auth.uid() sigue siendo el
 * del llamante, así que un usuario nunca puede consultar ni gastar la cuota
 * de otro.
 */
create or replace function public.ai_usage_hit(window_minutes integer, max_calls integer)
returns table (allowed boolean, used integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller      uuid;
  window_len  interval;
  since       timestamptz;
  calls       integer;
  oldest      timestamptz;
begin
  caller := (select auth.uid());
  if caller is null then
    raise exception 'unauthenticated'
      using hint = 'Inicia sesión para usar el asistente.';
  end if;

  -- Límites sanos: los parámetros llegan del servidor, pero una RPC es
  -- alcanzable directamente y no debe aceptar una ventana absurda.
  window_minutes := least(greatest(coalesce(window_minutes, 1440), 1), 10080);
  max_calls      := least(greatest(coalesce(max_calls, 200), 1), 100000);
  window_len     := make_interval(mins => window_minutes);
  since          := now() - window_len;

  select count(*), min(created_at)
    into calls, oldest
    from public.ai_usage
   where user_id = caller
     and created_at >= since;

  if calls >= max_calls then
    -- Se devuelve cuándo vuelve a haber hueco: la llamada más antigua de la
    -- ventana es la primera en caducar.
    return query select false, calls, oldest + window_len;
    return;
  end if;

  insert into public.ai_usage (user_id) values (caller);

  -- Poda perezosa: sin esto la tabla crecería para siempre. Se hace aquí y no
  -- en un cron para que el despliegue no dependa de pg_cron.
  delete from public.ai_usage
   where user_id = caller
     and created_at < now() - interval '7 days';

  return query select true, calls + 1, now() + window_len;
end;
$$;

revoke all on function public.ai_usage_hit(integer, integer) from public;
grant execute on function public.ai_usage_hit(integer, integer) to authenticated;
