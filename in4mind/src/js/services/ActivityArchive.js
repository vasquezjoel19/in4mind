/**
 * IN4MIND — Archivo histórico de actividad en IndexedDB.
 *
 * El registro de `GamificationService` vive en localStorage y se recorta a las
 * últimas 90 ENTRADAS —que no son 90 días—. Con cinco actividades diarias eso
 * son menos de tres semanas, así que el mapa de calor del panel pedía medio
 * año de historia y recibía un trozo, sin avisar de que faltaba el resto.
 *
 * Aquí se guarda todo. No se sustituye el log de localStorage: aquel sigue
 * sirviendo las lecturas SÍNCRONAS (racha, resumen semanal) que el panel pinta
 * en el primer fotograma, y cambiarlas por un store asíncrono retrasaría ese
 * pintado. Este archivo es el que guarda la historia larga, que se lee sin
 * prisa y desde código que ya era asíncrono.
 *
 * Y resuelve el cupo de paso: localStorage deja de ser el sitio donde crece
 * nada. Su tope de 90 entradas pasa a ser una caché caliente en vez de un
 * techo para los datos.
 */

'use strict';

const ActivityArchive = (() => {

  const DB = 'in4mind';
  const VERSION = 1;
  const TIENDA = 'actividad';
  const MARCA_IMPORTE = 'in4mind_archive_importado';

  let _db = null;
  let _abriendo = null;

  function _cuenta() {
    if (typeof UserScopedStorage !== 'undefined' && UserScopedStorage.accountId) {
      try { return UserScopedStorage.accountId(); } catch { /* abajo */ }
    }
    return 'guest';
  }

  function disponible() {
    try { return typeof indexedDB !== 'undefined' && indexedDB !== null; }
    catch { return false; }
  }

  /** Abre (o crea) la base. Resuelve a `null` si el navegador no deja. */
  function _abrir() {
    if (_db) return Promise.resolve(_db);
    if (_abriendo) return _abriendo;
    if (!disponible()) return Promise.resolve(null);

    _abriendo = new Promise((resolve) => {
      let peticion;
      /* En navegación privada de algunos navegadores `open` lanza en vez de
         emitir `onerror`, así que la llamada va dentro del try. */
      try { peticion = indexedDB.open(DB, VERSION); }
      catch { resolve(null); return; }

      peticion.onupgradeneeded = () => {
        const db = peticion.result;
        if (!db.objectStoreNames.contains(TIENDA)) {
          const tienda = db.createObjectStore(TIENDA, { keyPath: 'id', autoIncrement: true });
          // Se consulta siempre por fecha y por cuenta: ambos con índice.
          tienda.createIndex('at', 'at');
          tienda.createIndex('cuenta', 'cuenta');
        }
      };
      peticion.onsuccess = () => { _db = peticion.result; resolve(_db); };
      peticion.onerror = () => resolve(null);
      peticion.onblocked = () => resolve(null);
    });
    return _abriendo;
  }

  function _tx(modo) {
    return _abrir().then((db) => {
      if (!db) return null;
      try { return db.transaction(TIENDA, modo).objectStore(TIENDA); }
      catch { return null; }
    });
  }

  /**
   * Añade una actividad. No se espera a que termine.
   *
   * Guardar el histórico nunca debe retrasar lo que el alumno está haciendo,
   * y si falla, el log de localStorage sigue teniendo lo reciente.
   */
  async function append(entrada) {
    if (!entrada || typeof entrada.at !== 'number') return false;
    const tienda = await _tx('readwrite');
    if (!tienda) return false;
    try {
      tienda.add({ ...entrada, cuenta: _cuenta() });
      return true;
    } catch { return false; }
  }

  /** Actividades de esta cuenta desde `ts`, ordenadas por fecha. */
  async function since(ts) {
    const tienda = await _tx('readonly');
    if (!tienda) return [];
    const cuenta = _cuenta();

    return new Promise((resolve) => {
      const salida = [];
      let peticion;
      try {
        peticion = tienda.index('at').openCursor(IDBKeyRange.lowerBound(ts));
      } catch { resolve([]); return; }

      peticion.onsuccess = () => {
        const cursor = peticion.result;
        if (!cursor) { resolve(salida); return; }
        // El filtro por cuenta va aquí y no en el índice: la consulta es por
        // rango de fechas, y mezclar los dos pediría un índice compuesto.
        if (cursor.value?.cuenta === cuenta) salida.push(cursor.value);
        cursor.continue();
      };
      peticion.onerror = () => resolve(salida);
    });
  }

  /**
   * Trae una vez lo que hubiera en el log de localStorage.
   *
   * Sin esto, quien ya venía usando la plataforma vería su mapa de calor
   * empezar de cero el día que esto se despliega.
   */
  async function importarLegado() {
    let yaHecho = false;
    try { yaHecho = localStorage.getItem(MARCA_IMPORTE) === '1'; } catch { return 0; }
    if (yaHecho) return 0;
    if (!disponible()) return 0;

    let log = [];
    try {
      log = (typeof GamificationService !== 'undefined' && GamificationService.getActivityLog)
        ? GamificationService.getActivityLog() || [] : [];
    } catch { log = []; }

    let n = 0;
    for (const e of log) {
      if (e && typeof e.at === 'number' && await append(e)) n += 1;
    }
    try { localStorage.setItem(MARCA_IMPORTE, '1'); } catch { /* se reintentará */ }
    return n;
  }

  return { disponible, append, since, importarLegado };

})();

if (typeof module !== 'undefined') module.exports = ActivityArchive;
