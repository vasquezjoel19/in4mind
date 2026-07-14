/**
 * IN4MIND — Plantilla Supabase
 * En Vercel: define SUPABASE_URL y SUPABASE_ANON_KEY como variables de entorno.
 * En local: copia como supabase.config.js o ejecuta npm run build con .env
 */
'use strict';

const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const _sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
