/**
 * IN4MIND — Orbe del asistente.
 *
 * Esfera de luz en la cabecera del chat: respira en reposo y gira con un pulso
 * más marcado mientras la IA piensa.
 *
 * Deliberadamente **no** usa Three.js. El orbe mide 34 px; cargar 194 KB de
 * motor 3D para eso costaría casi tres veces lo que pesa todo el arranque de la
 * aplicación, y a ese tamaño la diferencia visual con degradados radiales y un
 * anillo en rotación es inapreciable. Aquí el volumen lo dan las capas de luz,
 * no una malla: el resultado se compone en GPU y no cuesta prácticamente nada.
 *
 * El movimiento vive en CSS (ver `orb.css`), así que `prefers-reduced-motion`
 * lo detiene sin que este fichero tenga que enterarse.
 */

'use strict';

const ChatOrb = (() => {

  const ESTADOS = ['idle', 'thinking', 'offline'];

  let _raiz = null;

  /** @param {HTMLElement} destino contenedor donde insertar el orbe */
  function mount(destino) {
    if (!destino || _raiz) return _raiz;

    const orbe = document.createElement('span');
    orbe.className = 'orb orb--idle';
    // Decorativo: el estado real ya lo anuncia el texto de `#chat-status`.
    orbe.setAttribute('aria-hidden', 'true');

    /* Cuatro capas, de dentro afuera: núcleo, brillo especular desplazado
       (lo que da la lectura de esfera), anillo que orbita y halo exterior. */
    orbe.innerHTML = `
      <span class="orb__halo"></span>
      <span class="orb__core"></span>
      <span class="orb__spec"></span>
      <span class="orb__ring"></span>
    `;

    destino.appendChild(orbe);
    _raiz = orbe;
    return orbe;
  }

  /** @param {'idle'|'thinking'|'offline'} estado */
  function setState(estado) {
    if (!_raiz || !ESTADOS.includes(estado)) return;
    ESTADOS.forEach(e => _raiz.classList.remove(`orb--${e}`));
    _raiz.classList.add(`orb--${estado}`);
  }

  function destroy() {
    _raiz?.remove();
    _raiz = null;
  }

  return { mount, setState, destroy };

})();

if (typeof module !== 'undefined') module.exports = ChatOrb;
