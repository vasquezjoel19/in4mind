/**
 * IN4MIND — Supabase (generado en build)
 * Variables: SUPABASE_URL, SUPABASE_ANON_KEY
 */
'use strict';

const SUPABASE_URL = "https://opocfwypcucpbrbpdixi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wb2Nmd3lwY3VjcGJyYnBkaXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzcyMTUsImV4cCI6MjA5NzIxMzIxNX0.-rKhtMGBnhF0uBS4B0hmvpMfGkQ5K_if52SonLWEm1o";

/* La sesión entre visitas depende solo de esto: un token con caducidad y
   refresco, gestionado por la librería. La aplicación ya no guarda ninguna
   credencial — "Recordar datos" se limita al correo. Las opciones van
   explícitas aunque coincidan con los valores por defecto, porque ahora son
   el único mecanismo de persistencia y no deben cambiar por accidente. */
const _sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
