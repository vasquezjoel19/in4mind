/**
 * IN4MIND — Supabase (generado en build)
 * Variables: SUPABASE_URL, SUPABASE_ANON_KEY
 */
'use strict';

const SUPABASE_URL = "https://opocfwypcucpbrbpdixi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wb2Nmd3lwY3VjcGJyYnBkaXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzcyMTUsImV4cCI6MjA5NzIxMzIxNX0.-rKhtMGBnhF0uBS4B0hmvpMfGkQ5K_if52SonLWEm1o";

/**
 * Persistencia de sesión delegada por completo a Supabase Auth.
 *
 * 'persistSession' guarda el token renovable en el navegador y
 * 'autoRefreshToken' lo renueva solo, así que volver a entrar no exige
 * reescribir credenciales. Esto es lo que sustituye a la contraseña que
 * versiones anteriores guardaban en localStorage.
 *
 * 'detectSessionInUrl' es lo que convierte el enlace del correo de
 * recuperación (y el retorno de Google) en una sesión válida.
 */
const SUPABASE_AUTH_OPTIONS = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
};
const _sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: SUPABASE_AUTH_OPTIONS });
