/**
 * IN4MIND — Tiempo real de estudio por curso y por día.
 *
 * Cuenta sólo mientras la lección está abierta Y la pestaña visible: dejar el
 * navegador abierto toda la noche no es haber estudiado ocho horas, y si el
 * contador se lo creyera, el mapa de calor y el bonus por velocidad dejarían
 * de significar nada.
 *
 * Se guarda por día para poder dibujar el mapa de calor, y acumulado por curso
 * para comparar contra la duración que el temario declara.
 */

'use strict';

const StudyTimeService = (() => {

  const KEY = 'in4mind_study_time';
  /* Un tramo más largo que esto entre latidos significa que la pestaña estuvo
     dormida (suspendida, portátil cerrado): se descarta en vez de sumarlo. */
  const MAX_TRAMO_S = 90;
  const LATIDO_MS = 15000;

  let _curso = null;
  let _desde = 0;
  let _latido = 0;

  function _read() {
    if (typeof UserScopedStorage !== 'undefined') {
      return UserScopedStorage.getJson(KEY, {}) || {};
    }
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { return {}; }
  }

  function _write(data) {
    if (typeof UserScopedStorage !== 'undefined') {
      UserScopedStorage.setJson(KEY, data);
      return;
    }
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch { /* sin almacenamiento: la sesión cuenta igual, no se conserva */ }
  }

  function _dia(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Vuelca a disco lo acumulado desde el último corte. */
  function _volcar() {
    if (!_curso || !_desde) return;
    const ahora = Date.now();
    const segundos = Math.round((ahora - _desde) / 1000);
    _desde = ahora;
    if (segundos <= 0 || segundos > MAX_TRAMO_S) return;

    const data = _read();
    data.cursos = data.cursos || {};
    data.dias = data.dias || {};
    data.cursos[_curso] = (data.cursos[_curso] || 0) + segundos;
    const hoy = _dia();
    data.dias[hoy] = (data.dias[hoy] || 0) + segundos;
    _write(data);
  }

  function start(courseId) {
    if (!courseId) return;
    if (_curso && _curso !== courseId) stop();
    if (_curso === courseId && _latido) return;

    _curso = courseId;
    _desde = Date.now();
    clearInterval(_latido);
    // Se vuelca cada poco: cerrar la pestaña de golpe no debe perder el rato.
    _latido = setInterval(_volcar, LATIDO_MS);
  }

  function stop() {
    _volcar();
    clearInterval(_latido);
    _latido = 0;
    _curso = null;
    _desde = 0;
  }

  /** Segundos acumulados en un curso. */
  function getSeconds(courseId) {
    _volcar();
    return (_read().cursos || {})[courseId] || 0;
  }

  /**
   * Segundos por día de los últimos `dias`, del más antiguo al de hoy.
   * @returns {{dia: string, segundos: number}[]}
   */
  function getDaily(dias = 14) {
    _volcar();
    const data = _read().dias || {};
    const salida = [];
    for (let i = dias - 1; i >= 0; i -= 1) {
      const clave = _dia(Date.now() - i * 86400000);
      salida.push({ dia: clave, segundos: data[clave] || 0 });
    }
    return salida;
  }

  /** Días seguidos con algo de estudio, contando hacia atrás desde hoy. */
  function getStreak() {
    const dias = getDaily(60);
    let racha = 0;
    for (let i = dias.length - 1; i >= 0; i -= 1) {
      if (dias[i].segundos > 0) racha += 1;
      // Hoy todavía puede estar a cero sin romper la racha de ayer.
      else if (i !== dias.length - 1) break;
    }
    return racha;
  }

  if (typeof document !== 'undefined') {
    /* Salir de la pestaña corta el cronómetro; volver lo reanuda. Sin esto se
       contaría como estudio todo el tiempo en otra pestaña. */
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') _volcar();
      else if (_curso) _desde = Date.now();
    });
    window.addEventListener('pagehide', _volcar);
  }

  return { start, stop, getSeconds, getDaily, getStreak };

})();

if (typeof module !== 'undefined') module.exports = StudyTimeService;
