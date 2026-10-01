/**
 * IN4MIND — Glosario en línea dentro de la lección.
 *
 * Marca los términos técnicos que aparecen en el texto y, al pasar por encima
 * o enfocarlos, Infy explica qué significan sin sacar al alumno de la página.
 *
 * Tres reglas que evitan que esto estorbe más de lo que ayuda:
 *
 *  1. **Sólo nodos de texto.** Se recorre el árbol con un TreeWalker en vez de
 *     tocar `innerHTML`: reescribir el HTML de un bloque destruiría los
 *     listeners que el controlador ya enganchó ahí.
 *  2. **Una vez por término.** Subrayar «función» catorce veces convierte el
 *     párrafo en un campo de minas y deja de señalar nada.
 *  3. **Fuera del código.** Dentro de `pre`, `code` o un editor, una palabra
 *     no es vocabulario: es sintaxis.
 */

'use strict';

const LessonGlossary = (() => {

  const PROHIBIDOS = new Set(['PRE', 'CODE', 'KBD', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON', 'A']);
  const MAX_MARCAS = 12;      // por lección; más que esto satura la lectura

  let _tip = null;

  /**
   * Minúsculas y sin tildes, SIN cambiar la longitud.
   *
   * `normalize('NFD')` separa la tilde en un carácter aparte y alarga la
   * cadena, así que los índices del texto normalizado dejarían de servir para
   * cortar el original. Sustituyendo letra por letra, cada posición sigue
   * siendo la misma y el corte cae donde debe.
   */
  const ACENTOS = { á: 'a', à: 'a', ä: 'a', â: 'a', é: 'e', è: 'e', ë: 'e', ê: 'e', í: 'i', ì: 'i', ï: 'i', î: 'i', ó: 'o', ò: 'o', ö: 'o', ô: 'o', ú: 'u', ù: 'u', ü: 'u', û: 'u', ñ: 'n', ç: 'c' };

  function _norm(s) {
    return (s || '').toLowerCase().replace(/[áàäâéèëêíìïîóòöôúùüûñç]/g, (c) => ACENTOS[c] || c);
  }

  function _escaparRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function _dentroDeProhibido(nodo) {
    for (let el = nodo.parentElement; el; el = el.parentElement) {
      if (PROHIBIDOS.has(el.tagName)) return true;
      if (el.classList?.contains('lw-check')) return true;      // checkpoint
      if (el.hasAttribute?.('data-sandbox')) return true;
      if (el.classList?.contains('in4-term')) return true;      // ya marcado
    }
    return false;
  }

  function _ocultarTip() {
    _tip?.remove();
    _tip = null;
  }

  function _mostrarTip(marca) {
    _ocultarTip();
    const texto = marca.dataset.termDef;
    if (!texto) return;

    const caja = document.createElement('div');
    caja.className = 'in4-term__tip';
    caja.id = `term-tip-${Math.random().toString(36).slice(2, 8)}`;
    caja.setAttribute('role', 'tooltip');

    if (typeof InfyMascot !== 'undefined' && InfyMascot.GESTOS?.LEARNING) {
      const img = document.createElement('img');
      img.className = 'in4-term__infy';
      img.src = `${InfyMascot.RUTA}${InfyMascot.GESTOS.LEARNING}`;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.width = 30; img.height = 30;
      caja.appendChild(img);
    }

    const cuerpo = document.createElement('div');
    const titulo = document.createElement('strong');
    titulo.textContent = marca.textContent;
    const def = document.createElement('span');
    def.className = 'in4-term__def';
    def.textContent = texto;
    cuerpo.append(titulo, def);
    caja.appendChild(cuerpo);

    document.body.appendChild(caja);
    _tip = caja;
    marca.setAttribute('aria-describedby', caja.id);

    /* `fixed`, así que las coordenadas son de viewport. Se recorta contra los
       dos bordes; `innerWidth` puede llegar a 0 antes del primer diseño y sin
       respaldo el globo acabaría en negativo. */
    const r = marca.getBoundingClientRect();
    const ancho = caja.offsetWidth || 240;
    const viewport = window.innerWidth || (ancho + 16);
    const izq = Math.max(8, Math.min(r.left, viewport - ancho - 8));
    const arriba = r.top - caja.offsetHeight - 8;
    caja.style.left = `${izq}px`;
    caja.style.top = arriba < 8 ? `${r.bottom + 8}px` : `${arriba}px`;
  }

  function _marcar(nodo, termino, definicion) {
    /* Se busca sobre el texto normalizado para que «función» encuentre la
       entrada «funcion», y se corta sobre el original: así la palabra marcada
       conserva su tilde y sus mayúsculas tal como la escribió el temario. */
    const re = new RegExp(`\\b${_escaparRegex(termino)}\\b`, 'i');
    const m = re.exec(_norm(nodo.nodeValue));
    if (!m) return false;

    const antes = nodo.nodeValue.slice(0, m.index);
    const medio = nodo.nodeValue.slice(m.index, m.index + m[0].length);
    const despues = nodo.nodeValue.slice(m.index + m[0].length);

    const marca = document.createElement('span');
    marca.className = 'in4-term';
    marca.textContent = medio;
    marca.dataset.termDef = definicion;
    marca.tabIndex = 0;
    marca.setAttribute('role', 'button');
    marca.setAttribute('aria-label', `${medio}: ${definicion}`);

    marca.addEventListener('mouseenter', () => _mostrarTip(marca));
    marca.addEventListener('mouseleave', _ocultarTip);
    marca.addEventListener('focus', () => _mostrarTip(marca));
    marca.addEventListener('blur', _ocultarTip);

    const padre = nodo.parentNode;
    padre.insertBefore(document.createTextNode(antes), nodo);
    padre.insertBefore(marca, nodo);
    nodo.nodeValue = despues;
    return true;
  }

  /**
   * Marca los términos del glosario dentro de `raiz`.
   *
   * @returns {number} cuántos se marcaron
   */
  function aplicar(raiz) {
    if (!raiz || typeof GlossaryTerms === 'undefined') return 0;

    const pendientes = GlossaryTerms.claves();   // los largos primero
    const hechos = new Set();
    let marcados = 0;

    for (const termino of pendientes) {
      if (marcados >= MAX_MARCAS) break;
      if (hechos.has(termino)) continue;
      const definicion = GlossaryTerms.get(termino);
      if (!definicion) continue;

      /* El recorrido se rehace por término: marcar parte el nodo de texto en
         tres, y un TreeWalker vivo se perdería en mitad de esa cirugía. */
      const caminante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.nodeValue.trim().length > 2 && !_dentroDeProhibido(n))
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
      });

      const nodos = [];
      for (let n = caminante.nextNode(); n; n = caminante.nextNode()) nodos.push(n);

      for (const nodo of nodos) {
        if (!_norm(nodo.nodeValue).includes(_norm(termino))) continue;
        if (_marcar(nodo, termino, definicion)) {
          hechos.add(termino);
          marcados += 1;
          break;      // una vez por término
        }
      }
    }
    return marcados;
  }

  /** Quita todas las marcas y deja el texto como estaba. */
  function limpiar(raiz = document) {
    _ocultarTip();
    raiz.querySelectorAll('.in4-term').forEach((el) => {
      el.replaceWith(document.createTextNode(el.textContent));
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', _ocultarTip, { passive: true });
  }

  return { aplicar, limpiar };

})();

if (typeof module !== 'undefined') module.exports = LessonGlossary;
