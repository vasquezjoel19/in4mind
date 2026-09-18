/**
 * IN4MIND — Inclinación 3D de las tarjetas al pasar el ratón.
 *
 * La tarjeta se gira hacia el cursor con `perspective` + `rotateX/rotateY`.
 * No usa ninguna librería: son dos ángulos y una transformación, y el navegador
 * lo resuelve en el compositor sin tocar el hilo principal.
 *
 * Solo se activa con puntero fino. En táctil no hay "hover": el efecto se
 * quedaría pegado tras el primer toque, que es peor que no tenerlo.
 */

'use strict';

const CardTilt = (() => {

  /* Catálogo, quizzes, proyectos guiados, el panel y las tarjetas de la
     landing. Se admite además `[data-tilt]` para marcar cualquier otra sin
     tocar este fichero.
     Ojo con lo que NO entra: nada que tenga contenido desplazable dentro ni
     campos de formulario, porque la transformación 3D crea un contexto de
     apilamiento y complica la posición del cursor. */
  const SELECTOR = [
    '.tut-grid-card', '.tut-lesson-card',
    '.quiz-card', '.gp-card',
    '.course-card', '.learning-path-card',
    '.lp-course-card',
    '[data-tilt]',
  ].join(',');

  const INCLINACION_MAX = 7;     // grados; más que esto marea y deforma el texto
  const ELEVACION = 10;          // px que la tarjeta "sube" hacia el usuario
  const SUAVIZADO = 0.16;

  let _activo = false;
  let _observador = null;
  const _enCurso = new WeakMap();   // elemento -> estado de animación

  function _permitido() {
    try {
      return window.matchMedia('(pointer: fine)').matches
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  function _estadoDe(el) {
    let s = _enCurso.get(el);
    if (!s) {
      s = { rx: 0, ry: 0, objRx: 0, objRy: 0, z: 0, objZ: 0, raf: 0 };
      _enCurso.set(el, s);
    }
    return s;
  }

  function _animar(el) {
    const s = _estadoDe(el);
    if (s.raf) return;

    const paso = () => {
      s.rx += (s.objRx - s.rx) * SUAVIZADO;
      s.ry += (s.objRy - s.ry) * SUAVIZADO;
      s.z  += (s.objZ  - s.z)  * SUAVIZADO;

      el.style.transform =
        `perspective(900px) rotateX(${s.rx.toFixed(3)}deg) rotateY(${s.ry.toFixed(3)}deg) translateZ(${s.z.toFixed(2)}px)`;

      // Se detiene al llegar: dejar un rAF vivo por tarjeta sería un goteo
      // constante de trabajo para nada.
      const quieto = Math.abs(s.objRx - s.rx) < 0.01
        && Math.abs(s.objRy - s.ry) < 0.01
        && Math.abs(s.objZ - s.z) < 0.05;

      if (quieto) {
        s.raf = 0;
        if (s.objRx === 0 && s.objRy === 0 && s.objZ === 0) {
          // De vuelta al reposo se limpia la propiedad para no dejar una
          // transformación fija que pise a la del CSS (el hover ya eleva).
          el.style.transform = '';
        }
        return;
      }
      s.raf = requestAnimationFrame(paso);
    };

    s.raf = requestAnimationFrame(paso);
  }

  function _alMover(ev) {
    const el = ev.currentTarget;
    const r = el.getBoundingClientRect();
    // Posición del cursor dentro de la tarjeta, de -0.5 a 0.5.
    const px = (ev.clientX - r.left) / r.width - 0.5;
    const py = (ev.clientY - r.top) / r.height - 0.5;

    const s = _estadoDe(el);
    // El signo de rotateX va invertido: mover el ratón hacia abajo debe hundir
    // el borde inferior, no levantarlo.
    s.objRx = -py * INCLINACION_MAX * 2;
    s.objRy = px * INCLINACION_MAX * 2;
    s.objZ = ELEVACION;

    // Punto de luz que sigue al cursor; lo usa el CSS con estas variables.
    el.style.setProperty('--tilt-x', `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--tilt-y', `${((py + 0.5) * 100).toFixed(1)}%`);

    _animar(el);
  }

  function _alSalir(ev) {
    const el = ev.currentTarget;
    const s = _estadoDe(el);
    s.objRx = 0;
    s.objRy = 0;
    s.objZ = 0;
    _animar(el);
  }

  function _enganchar(el) {
    if (el.dataset.tiltOn === '1') return;
    el.dataset.tiltOn = '1';
    el.classList.add('has-tilt');
    el.addEventListener('pointermove', _alMover, { passive: true });
    el.addEventListener('pointerleave', _alSalir, { passive: true });
    // Un puntero que se cancela (arrastre, cambio de ventana) también debe
    // devolver la tarjeta a su sitio, o se queda torcida.
    el.addEventListener('pointercancel', _alSalir, { passive: true });
  }

  function refresh() {
    if (!_activo) return;
    document.querySelectorAll(SELECTOR).forEach(_enganchar);
  }

  function init() {
    if (_activo || !_permitido()) return;
    _activo = true;
    refresh();

    /* El catálogo se pinta de forma asíncrona y se vuelve a pintar al filtrar
       o buscar, así que hay que enganchar también lo que aparezca después. */
    _observador = new MutationObserver((cambios) => {
      for (const c of cambios) {
        for (const nodo of c.addedNodes) {
          if (nodo.nodeType !== 1) continue;
          if (nodo.matches?.(SELECTOR)) _enganchar(nodo);
          nodo.querySelectorAll?.(SELECTOR).forEach(_enganchar);
        }
      }
    });
    _observador.observe(document.body, { childList: true, subtree: true });
  }

  function destroy() {
    _observador?.disconnect();
    _observador = null;
    _activo = false;
  }

  return { init, refresh, destroy };

})();

/* Arranque propio, por el mismo motivo que NeuralBackground. Si la pagina no
   tiene tarjetas, `init()` engancha cero elementos y no cuesta nada. */
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CardTilt.init(), { once: true });
  } else {
    CardTilt.init();
  }
}

if (typeof module !== 'undefined') module.exports = CardTilt;
