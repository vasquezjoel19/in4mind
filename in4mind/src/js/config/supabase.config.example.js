/**
 * IN4MIND — Plantilla Supabase
 * En Vercel: define SUPABASE_URL y SUPABASE_ANON_KEY como variables de entorno.
 * En local: copia como supabase.config.js o ejecuta npm run build con .env
 */
'use strict';

const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

/* La sesión persistente es responsabilidad exclusiva de Supabase Auth: la
   aplicación no guarda contraseñas en el navegador. */
const _sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
