# IN4MIND — Auditoría RLS (perfil / blobs)

Fecha de revisión: 2026-08-12

## Alcance

Tablas de sync de usuario en Supabase usadas por la app estática:

| Tabla | Propósito | Clave |
|-------|-----------|-------|
| `profiles` | Perfil del usuario (signup) | `id` = `auth.uid()` |
| `user_notes` | Notas del alumno (blob JSON) | `user_id` PK |
| `user_projects` | Proyectos libres | `user_id` PK |
| `quiz_attempts` | Intentos / progreso de quiz | `user_id` PK |
| `guided_progress` | Progreso de proyectos guiados | `user_id` PK |

Migraciones de referencia:
- `supabase/migrations/20260812_user_blobs.sql`
- `supabase/migrations/20260812_profiles_rls.sql`

## Profiles (signup)

- RLS habilitado con policy `users_own_profile` para `authenticated`:
  - `USING (auth.uid() = id)`
  - `WITH CHECK (auth.uid() = id)`
- Trigger `trg_on_auth_user_created` → `handle_new_user()` (SECURITY DEFINER) inserta el perfil al crear `auth.users`.
- El cliente también intenta `profiles.upsert` tras login/signup con sesión; sin JWT no debe bloquear el flujo de “confirma tu email”.

RPC relacionada: `is_exam_unlocked` (`20260812_exam_unlock_rpc.sql`) — solo lectura de progreso del `auth.uid()` actual.

## Controles esperados

Para cada tabla de blob:

1. **RLS habilitado** (`ALTER TABLE … ENABLE ROW LEVEL SECURITY`).
2. Políticas **solo para el dueño**:
   - `SELECT` / `INSERT` / `UPDATE` / `DELETE` con `auth.uid() = user_id`.
3. Sin policies anónimas ni `USING (true)`.
4. Grants limitados al rol `authenticated` (no `anon` con escritura).

## Checklist de verificación (Dashboard SQL)

```sql
-- RLS activo
select relname, relrowsecurity
from pg_class
where relname in ('user_notes','user_projects','quiz_attempts','guided_progress');

-- Políticas
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where tablename in ('user_notes','user_projects','quiz_attempts','guided_progress');
```

## Resultado de auditoría

- Las migraciones del repo definen RLS + policies por `auth.uid() = user_id` en las cuatro tablas.
- El cliente usa la **anon key** de Supabase; el acceso real a filas depende de la sesión JWT. Sin sesión, las operaciones deben fallar por RLS (comportamiento correcto).
- No hay políticas de lectura cruzada entre usuarios en estas tablas.
- Los blobs no deben contener secretos de API (Groq key, etc.); la app guarda progreso educativo.

## Recomendaciones operativas

1. Tras cada cambio de schema, re-ejecutar el checklist SQL en el proyecto remoto.
2. Revisar Advisors de Supabase (Security) periódicamente.
3. No desactivar RLS para “depurar” en producción.
4. Si se añaden tablas de perfil nuevas, copiar el mismo patrón: PK `user_id`, RLS on, policies owner-only.

## Chat global — identidad del autor (2026-09-21)

Migración: `supabase/migrations/20260921_chat_author_identity.sql`

Hallazgo: la policy de INSERT exigía `user_id = auth.uid()`, pero `author_name`
y `author_level` los enviaba el navegador. Con una sesión normal se podía
publicar firmando con el nombre de otra persona (o como si fuera soporte) y con
cualquier nivel: la autoría real estaba protegida, la identidad mostrada no.

Corrección:

1. Trigger `chat_messages_author_trg` (BEFORE INSERT) fija `user_id`,
   `author_name` y `author_level` leyendo `profiles` por `auth.uid()`.
   Lo que mande el cliente en esas columnas se descarta.
2. `profiles.level` (nuevo, 1–99) guarda el nivel de gamificación; el cliente
   solo puede escribir su propia fila (`users_own_profile`).
3. El trigger de identidad corre **antes** que `chat_messages_rate_limit_trg`
   —PostgreSQL los dispara en orden alfabético— para que el límite de un
   mensaje por segundo cuente siempre sobre el `user_id` real.

Verificación en el Dashboard SQL:

```sql
-- Debe devolver los dos triggers, con 'author' antes que 'rate_limit'
select tgname from pg_trigger
 where tgrelid = 'public.chat_messages'::regclass and not tgisinternal
 order by tgname;

-- Insertar con otro nombre no debe tener efecto: el guardado es el del perfil
insert into public.chat_messages (body, author_name, author_level)
values ('prueba', 'Soporte IN4MIND', 99)
returning author_name, author_level;
```

## Fuera de alcance de este documento

- CMS / panel admin de contenido (no implementado a propósito).
