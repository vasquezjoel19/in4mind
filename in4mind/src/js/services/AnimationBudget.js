/**
 * IN4MIND — Presupuesto de animación.
 *
 * Las animaciones CSS no se detienen solas cuando su elemento sale de la
 * pantalla: el navegador las sigue calculando y componiendo aunque nadie las
 * vea. La landing arranca con más de sesenta a la vez (ondas, partículas,
 * destellos, degradados en movimiento), casi todas repartidas por secciones que
 * quedan lejos del viewport mientras se lee la primera pantalla.
 *
 * Esto las pausa cuando no se ven y las reanuda al volver. No cambia nada
 * visualmente —cuando el elemento está a la vista, se anima igual— pero libera
 * al compositor de un trabajo constante que no llega a los ojos de nadie.
 *
 * También baja el coste de los `backdrop-filter` fuera de pantalla, que es la
 * propiedad más cara de la página: cada uno obliga a componer aparte lo que
 * tiene detrás.
 */

'use strict';

const AnimationBudget = (() => {

  /* Elementos decorativos con animación continua. Se listan de forma explícita
     en vez de barrer todo el documento: recorrer cada nodo preguntando por su
     estilo computado costaría más que lo que se ahorra. */
  const SELECTOR = [
    '.lp-ambient',
    '.lp-hero-illustration',
    '.lp-wave', '.lp-waves',
    '.lp-particles', '.lp-particle',
    '.lp-stars', '.lp-star',
    '.lp-section',
    '.lp-course-card',
    '.lp-testimonial',
    '.lp-stat',
    '[data-animated]',
  ].join(',');

  /* Margen generoso: se reanuda antes de que el elemento asome, para que nunca
     se vea entrar "a medias" ni dar un salto al empezar la animación. */
  const MARGEN = '240px';

  let _observador = null;
  let _activo = false;

  function _pausar(el) {
    if (el.dataset.animPaused === '1') return;
    el.dataset.animPaused = '1';
    el.style.animationPlayState = 'paused';
    // Los hijos animados también: el contenedor suele ser solo el marco.
    el.querySelectorAll('*').forEach(h => { h.style.animationPlayState = 'paused'; });
  }

  function _reanudar(el) {
    if (el.dataset.animPaused !== '1') return;
    delete el.dataset.animPaused;
    el.style.animationPlayState = '';
    el.querySelectorAll('*').forEach(h => { h.style.animationPlayState = ''; });
  }

  function _observar(el) {
    if (el.dataset.animBudget === '1') return;
    el.dataset.animBudget = '1';
    _observador.observe(el);
  }

  function refresh() {
    if (!_activo) return;
    document.querySelectorAll(SELECTOR).forEach(_observar);
  }

  function init() {
    if (_activo || typeof IntersectionObserver === 'undefined') return;

    /* Con movimiento reducido no hay animaciones que pausar, y además pisar
       `animationPlayState` podría reactivar algo que el CSS había detenido. */
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch { /* sin matchMedia: se continúa */ }

    _activo = true;
    _observador = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) _reanudar(e.target); else _pausar(e.target);
      }
    }, { rootMargin: MARGEN });

    refresh();

    // Secciones que se pintan después (carruseles, listas cargadas por JS).
    const mo = new MutationObserver((cambios) => {
      for (const c of cambios) {
        for (const n of c.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.matches?.(SELECTOR)) _observar(n);
          n.querySelectorAll?.(SELECTOR).forEach(_observar);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    _observador._mo = mo;
  }

  function destroy() {
    _observador?._mo?.disconnect();
    _observador?.disconnect();
    _observador = null;
    _activo = false;
  }

  return { init, refresh, destroy };

})();

if (typeof window !== 'undefined') {
  const arrancar = () => AnimationBudget.init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar, { once: true });
  } else {
    arrancar();
  }
}

if (typeof module !== 'undefined') module.exports = AnimationBudget;
