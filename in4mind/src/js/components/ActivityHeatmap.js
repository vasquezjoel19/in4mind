/**
 * IN4MIND — Rejilla de actividad diaria al estilo GitHub.
 *
 * Una columna por semana y siete filas (lunes arriba), con el color según
 * cuánto se hizo ese día. Al posarse sobre un día con actividad aparece Infy
 * con el XP y las tareas de esa fecha.
 *
 * El tooltip sólo sale en días con algo: abrirlo sobre un hueco para decir
 * «0 XP» interrumpe sin aportar, y la mayoría de la rejilla son huecos.
 */

'use strict';

const ActivityHeatmap = (() => {

  const DIAS = 182;          // medio año: cabe en el panel sin encogerse
  const UMBRALES = [1, 2, 4, 7];   // actividades por día para cada escalón

  function _t(clave, params, respaldo) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(clave, params);
      if (out && out !== clave) return out;
    }
    return respaldo;
  }

  function _nivel(total) {
    if (!total) return 0;
    let n = 1;
    for (const u of UMBRALES) if (total >= u) n = UMBRALES.indexOf(u) + 1;
    return Math.min(4, n);
  }

  function _fechaLegible(iso) {
    const [a, m, d] = iso.split('-').map(Number);
    try {
      const loc = (typeof I18n !== 'undefined' && I18n.getLocale) ? I18n.getLocale() : 'es';
      return new Date(a, m - 1, d).toLocaleDateString(loc, {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch { return iso; }
  }

  let _tip = null;

  function _ocultarTip() {
    _tip?.remove();
    _tip = null;
  }

  function _mostrarTip(celda, d) {
    _ocultarTip();
    if (!d.total) return;

    const caja = document.createElement('div');
    caja.className = 'heat-tip';
    caja.setAttribute('role', 'tooltip');

    if (typeof InfyMascot !== 'undefined' && InfyMascot.GESTOS?.SUCCESS) {
      const img = document.createElement('img');
      img.className = 'heat-tip__infy';
      img.src = `${InfyMascot.RUTA}${InfyMascot.GESTOS.SUCCESS}`;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.width = 34; img.height = 34;
      caja.appendChild(img);
    }

    const cuerpo = document.createElement('div');
    const fecha = document.createElement('strong');
    fecha.textContent = _fechaLegible(d.dia);
    const resumen = document.createElement('span');
    resumen.className = 'heat-tip__resumen';
    resumen.textContent = _t('heatmap.summary', { n: d.total, xp: d.xp },
      `${d.total} actividades · ${d.xp} XP`);
    cuerpo.append(fecha, resumen);

    if (d.tareas?.length) {
      const lista = document.createElement('ul');
      lista.className = 'heat-tip__lista';
      for (const t of d.tareas) {
        const li = document.createElement('li');
        li.textContent = t.titulo || t.tipo;
        lista.appendChild(li);
      }
      cuerpo.appendChild(lista);
    }

    caja.appendChild(cuerpo);
    document.body.appendChild(caja);
    _tip = caja;

    /* Posición en coordenadas de viewport porque el tooltip es `fixed`; y se
       recorta contra el borde derecho para que no se salga de la pantalla en
       las últimas columnas, que son las que más se miran. */
    const r = celda.getBoundingClientRect();
    const ancho = caja.offsetWidth || 220;
    /* `innerWidth` puede llegar a 0 cuando la ventana aún no tiene medidas; sin
       el respaldo, el recorte daría un izquierdo negativo y el tooltip
       aparecería fuera de la pantalla. El `Math.max` final es la última línea:
       pase lo que pase, nunca se coloca antes del borde. */
    const viewport = window.innerWidth || (ancho + 16);
    const centrado = r.left + r.width / 2 - ancho / 2;
    const izq = Math.max(8, Math.min(centrado, viewport - ancho - 8));
    const arriba = r.top - caja.offsetHeight - 10;
    caja.style.left = `${izq}px`;
    caja.style.top = arriba < 8 ? `${r.bottom + 10}px` : `${arriba}px`;
  }

  /** Dibuja la rejilla dentro de `#heat-grid`. */
  async function render() {
    const caja = document.getElementById('activity-heatmap');
    const grid = document.getElementById('heat-grid');
    if (!caja || !grid || typeof ActivityHeatmapService === 'undefined') return;

    let dias = [];
    try { dias = await ActivityHeatmapService.rejilla(DIAS); }
    catch { return; }

    const activos = dias.filter(d => d.total > 0);
    if (!activos.length) return;   // nada que enseñar todavía

    grid.textContent = '';
    /* Se rellena el principio de la primera semana para que las filas sean
       días de la semana de verdad y no una cuadrícula arbitraria. */
    const primero = new Date(`${dias[0].dia}T00:00:00`);
    const hueco = (primero.getDay() + 6) % 7;   // lunes = 0
    for (let i = 0; i < hueco; i += 1) {
      const v = document.createElement('span');
      v.className = 'heat__dia heat__dia--vacio';
      v.setAttribute('aria-hidden', 'true');
      grid.appendChild(v);
    }

    for (const d of dias) {
      const celda = document.createElement('span');
      celda.className = 'heat__dia';
      celda.dataset.nivel = String(_nivel(d.total));
      celda.tabIndex = d.total ? 0 : -1;
      celda.title = d.total
        ? _t('heatmap.day', { fecha: _fechaLegible(d.dia), n: d.total, xp: d.xp },
          `${_fechaLegible(d.dia)}: ${d.total} actividades, ${d.xp} XP`)
        : _fechaLegible(d.dia);

      if (d.total) {
        celda.addEventListener('mouseenter', () => _mostrarTip(celda, d));
        celda.addEventListener('mouseleave', _ocultarTip);
        // Teclado: el tooltip también tiene que alcanzarse sin ratón.
        celda.addEventListener('focus', () => _mostrarTip(celda, d));
        celda.addEventListener('blur', _ocultarTip);
      }
      grid.appendChild(celda);
    }

    const total = activos.reduce((n, d) => n + d.total, 0);
    const chip = document.getElementById('heat-total');
    if (chip) {
      /* Aquí NO va un total de XP. La tarjeta de arriba ya muestra el XP
         acumulado de siempre, y este mapa cubre sólo seis meses y sin contar
         dos veces lo mismo: las dos cifras nunca iban a coincidir, y verlas
         juntas y distintas hacía dudar de ambas. El XP por día sigue en el
         globo, que es donde significa algo. */
      chip.textContent = _t('heatmap.total', { n: total, dias: activos.length },
        `${total} actividades en ${activos.length} días`);
    }
    caja.hidden = false;
  }

  if (typeof window !== 'undefined') {
    // Un scroll con el tooltip abierto lo dejaría flotando lejos de su día.
    window.addEventListener('scroll', _ocultarTip, { passive: true });
  }

  return { render };

})();

if (typeof module !== 'undefined') module.exports = ActivityHeatmap;
