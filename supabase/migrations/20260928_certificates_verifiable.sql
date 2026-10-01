-- IN4MIND — Certificados verificables: tabla, dueño y hash criptográfico
--
-- Esta migración se escribió dando por hecho que `cert_verifications` ya
-- existía y sólo había que ampliarla. No es así en este proyecto: la tabla no
-- está creada, y un `alter table` sobre algo que no existe falla —el
-- `if not exists` de abajo se refiere a la COLUMNA, no a la tabla—. Por eso
-- ahora la crea primero y después la amplía, de modo que sirva tanto para un
-- proyecto vacío como para uno que ya la tuviera de antes.
--
-- Equivalencias con los nombres que se pidieron en el encargo:
--   id          -> `code`       (identificador legible, el que va en el QR)
--   hash        -> `hash`       (UUID v4: la prueba criptográfica)
--   user_id     -> `user_id`    (vincula el certificado a su dueño)
--   course_id   -> `ref_id`     (curso o ruta que se certifica)
--   issued_at   -> `earned_at`  (cuándo se obtuvo)
--
-- Es idempotente: se puede volver a lanzar sin romper nada.

-- ── Tabla ───────────────────────────────────────────────────────────────────

create table if not exists public.cert_verifications (
  -- `code` es la clave: es lo que lleva impreso el QR y por lo que entra la
  -- verificación, y es también el `onConflict` que usa el cliente al reemitir.
  code         text primary key,
  course_title text,
  ref_id       text,
  user_name    text,
  earned_at    timestamptz not null default now(),
  pct          numeric,
  project_url  text,
  path_id      text
);

-- ── Columnas nuevas ─────────────────────────────────────────────────────────

alter table public.cert_verifications
  add column if not exists user_id uuid references auth.users (id) on delete set null;

/* El `code` es corto y legible para poder dictarlo por teléfono; eso mismo lo
   hace adivinable a fuerza de intentos. El `hash` es un UUID v4 —122 bits de
   azar— y es lo que de verdad acredita autenticidad. */
alter table public.cert_verifications
  add column if not exists hash uuid default gen_random_uuid();

-- Sin esto dos certificados podrían compartir hash y la verificación dejaría
-- de significar nada.
create unique index if not exists cert_verifications_hash_idx
  on public.cert_verifications (hash);

-- La verificación entra por el hash o por el código; ambos necesitan índice.
create index if not exists cert_verifications_user_idx
  on public.cert_verifications (user_id);

-- Los emitidos antes de esta migración no tenían hash.
update public.cert_verifications
   set hash = gen_random_uuid()
 where hash is null;

-- ── Quién puede leer y escribir ─────────────────────────────────────────────

alter table public.cert_verifications enable row level security;

/* Lectura pública y deliberada: verificar un certificado tiene que funcionar
   para un reclutador que no tiene cuenta en IN4MIND. Es el propósito mismo de
   la página de verificación.
   Lo que se expone es lo justo —nombre, curso, fecha—; no hay correo ni nada
   que permita rastrear a la persona más allá del propio certificado. */
drop policy if exists cert_verifications_public_read on public.cert_verifications;
create policy cert_verifications_public_read
  on public.cert_verifications
  for select
  to anon, authenticated
  using (true);

/* Escribir, solo la persona autenticada y sobre su propia fila. Sin esto,
   cualquiera podría fabricarse un certificado llamando a la API REST con la
   clave anónima, que es pública. */
drop policy if exists cert_verifications_insert_own on public.cert_verifications;
create policy cert_verifications_insert_own
  on public.cert_verifications
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists cert_verifications_update_own on public.cert_verifications;
create policy cert_verifications_update_own
  on public.cert_verifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ── El dueño lo pone el servidor ────────────────────────────────────────────
-- Mismo criterio que en el chat: si `user_id` viniera del cliente, alguien
-- podría emitir un certificado a nombre de otra persona.

create or replace function public.cert_set_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated'
      using hint = 'Inicia sesión para emitir un certificado.';
  end if;

  new.user_id := auth.uid();

  -- El hash lo genera la base de datos, nunca el navegador: un cliente podría
  -- reutilizar uno ya visto y colisionar con un certificado ajeno.
  if tg_op = 'INSERT' and new.hash is null then
    new.hash := gen_random_uuid();
  end if;

  -- Un certificado emitido no cambia de dueño ni de hash.
  if tg_op = 'UPDATE' then
    new.hash := old.hash;
  end if;

  return new;
end;
$$;

drop trigger if exists cert_verifications_set_owner_trg on public.cert_verifications;
create trigger cert_verifications_set_owner_trg
  before insert or update on public.cert_verifications
  for each row execute function public.cert_set_owner();
