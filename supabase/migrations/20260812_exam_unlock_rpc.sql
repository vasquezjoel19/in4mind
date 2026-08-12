-- IN4MIND — RPC de desbloqueo de examen (defensa en profundidad).
-- Criterio alineado al cliente: promedio de lecciones >= 80 y quiz del curso >= 70.
-- Si las tablas aún no tienen suficientes filas, la función puede devolver false;
-- el cliente mantiene su propia validación como fallback.

create or replace function public.is_exam_unlocked(p_course_id text, p_total_lessons integer default 0)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  lesson_avg numeric := 0;
  lesson_count integer := 0;
  quiz_best numeric := 0;
begin
  if uid is null or p_course_id is null or length(trim(p_course_id)) = 0 then
    return false;
  end if;

  select coalesce(avg(pct), 0), count(*)
    into lesson_avg, lesson_count
    from public.lesson_progress
   where user_id = uid
     and course_id = p_course_id;

  select coalesce(max(best_pct), 0)
    into quiz_best
    from public.quiz_progress
   where user_id = uid
     and quiz_id = p_course_id;

  if p_total_lessons > 0 and lesson_count < greatest(1, ceil(p_total_lessons * 0.5)) then
    return false;
  end if;

  return lesson_avg >= 80 and quiz_best >= 70;
end;
$$;

revoke all on function public.is_exam_unlocked(text, integer) from public;
grant execute on function public.is_exam_unlocked(text, integer) to authenticated;
