/**
 * IN4MIND — Infy como guía de toda la plataforma.
 *
 * `InfyMascot` pone la cara del asistente en la cabecera del chat y conoce el
 * vocabulario de gestos. Este servicio va un paso más allá: lleva a Infy al
 * resto de la aplicación —saludo del panel, avisos de logro, estados vacíos y
 * el acceso rápido flotante— sin que ninguna de esas pantallas tenga que
 * saber cómo se dibuja una mascota.
 *
 * Por qué dos archivos y no uno: el mapa de gestos y el avatar del chat ya
 * estaban y funcionan. Duplicar aquí las rutas de los dibujos sería tener dos
 * fuentes de verdad que se desincronizan al primer cambio de asset, así que
 * este servicio delega en `InfyMascot.crear()` y no guarda rutas propias. Si
 * la mascota no está cargada en una página, todo esto no hace nada y la
 * página se comporta como antes.
 *
 * Nada de lo que hay aquí bloquea el pintado: las imágenes van con
 * `loading="lazy"` salvo la del saludo —que entra en el primer visible del
 * panel— y el panel del acceso rápido no existe en el DOM hasta que alguien
 * lo abre.
 */

'use strict';

const MascotService = (() => {

  /** Lo que tarda un aviso en desvanecerse si nadie dice otra cosa. */
  const AVISO_MS = 3600;

  let _aviso = null;
  let _avisoTimer = 0;
  let _drawer = null;
  let _fab = null;

  function _t(key, fallback, params) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key, params);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  /** ¿Está la mascota cargada en esta página? Sin ella, todo esto se calla. */
  function _hayMascota() {
    return typeof InfyMascot !== 'undefined';
  }

  /**
   * Imagen de Infy con el gesto pedido.
   * @param {string} gesto     IDLE | THINKING | LEARNING | SUCCESS | ERROR
   * @param {string} variante  sufijo de clase, para que el CSS la coloque
   * @param {boolean} ansiosa  true solo para lo que entra en el primer visible
   */
  function _img(gesto, variante, ansiosa = false) {
    if (!_hayMascota()) return null;
    const img = InfyMascot.crear(variante, gesto);
    if (!ansiosa) img.loading = 'lazy';
    return img;
  }

  /* ── Avisos ────────────────────────────────────────────────────────────── */

  /**
   * Aviso flotante con Infy: un logro, una racha, un módulo completado.
   *
   * Para texto sin mascota ya está `AppShell.showToast`; esto es para cuando
   * el gesto es parte del mensaje.
   *
   * @param {string} mensaje
   * @param {string} gesto     por defecto celebra
   * @param {number} duracion  en milisegundos
   */
  function showToast(mensaje, gesto = 'SUCCESS', duracion = AVISO_MS) {
    if (!_hayMascota() || !mensaje) return null;

    clearTimeout(_avisoTimer);
    _aviso?.remove();

    const caja = document.createElement('div');
    caja.className = 'infy-toast';
    /* `status` y no `alert`: es un refuerzo positivo, no algo que deba
       interrumpir lo que se esté leyendo con un lector de pantalla. */
    caja.setAttribute('role', 'status');
    caja.setAttribute('aria-live', 'polite');

    const img = _img(gesto, 'toast');
    if (img) {
      img.alt = '';                       // decorativa: el texto ya lo dice
      img.setAttribute('aria-hidden', 'true');
      caja.appendChild(img);
    }

    const texto = document.createElement('p');
    texto.className = 'infy-toast__text';
    texto.textContent = mensaje;          // puede venir del modelo: nunca HTML
    caja.appendChild(texto);

    document.body.appendChild(caja);
    _aviso = caja;

    // El siguiente fotograma, para que la transición de entrada se vea.
    requestAnimationFrame(() => caja.classList.add('is-visible'));

    _avisoTimer = setTimeout(() => {
      caja.classList.remove('is-visible');
      setTimeout(() => { if (caja === _aviso) { caja.remove(); _aviso = null; } }, 260);
    }, duracion);

    return caja;
  }

  /* ── Tarjetas de estado vacío ──────────────────────────────────────────── */

  /**
   * Sustituye el contenido de `destino` por una tarjeta con Infy.
   *
   * @param {Element} destino
   * @param {{gesto?:string, titulo?:string, texto?:string,
   *          accion?:{texto:string, href?:string, onClick?:Function}}} opciones
   */
  function renderCard(destino, opciones = {}) {
    if (!destino || !_hayMascota()) return null;

    const { gesto = 'IDLE', titulo, texto, accion } = opciones;

    const tarjeta = document.createElement('div');
    tarjeta.className = 'infy-card';

    const img = _img(gesto, 'card');
    if (img) {
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      tarjeta.appendChild(img);
    }

    if (titulo) {
      const h = document.createElement('p');
      h.className = 'infy-card__title';
      h.textContent = titulo;
      tarjeta.appendChild(h);
    }

    if (texto) {
      const p = document.createElement('p');
      p.className = 'infy-card__text';
      p.textContent = texto;
      tarjeta.appendChild(p);
    }

    if (accion?.texto) {
      const el = accion.href
        ? document.createElement('a')
        : document.createElement('button');
      el.className = 'infy-card__action';
      el.textContent = accion.texto;
      if (accion.href) el.href = accion.href;
      else {
        el.type = 'button';
        if (accion.onClick) el.addEventListener('click', accion.onClick);
      }
      tarjeta.appendChild(el);
    }

    destino.textContent = '';
    destino.appendChild(tarjeta);
    return tarjeta;
  }

  /**
   * Pone a Infy en los estados vacíos que ya existen.
   *
   * Los pintan cinco controladores distintos, y cada uno arma su HTML por su
   * cuenta. En vez de tocar los cinco —y de obligar a que el siguiente se
   * acuerde—, se sustituye aquí el icono genérico por la mascota: el hueco
   * ya está marcado con `.empty-state__icon` en todos.
   *
   * El gesto sale de `data-infy-gesto` si quien pinta quiere elegirlo; por
   * defecto saluda.
   */
  function decorateEmptyStates(raiz = document) {
    if (!_hayMascota()) return 0;
    let n = 0;
    for (const icono of raiz.querySelectorAll('.empty-state__icon, .empty-state-panel__icon')) {
      if (icono.dataset.infyDone === '1') continue;
      const img = _img(icono.dataset.infyGesto || 'IDLE', 'card');
      if (!img) continue;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      icono.textContent = '';
      icono.appendChild(img);
      icono.dataset.infyDone = '1';
      n += 1;
    }
    return n;
  }

  /**
   * Los estados vacíos aparecen cuando el controlador termina de filtrar, no
   * en el arranque, así que hay que enterarse de los que llegan después.
   * El observador mira solo si se añadieron nodos y delega en la función de
   * arriba, que ya ignora lo que ya está hecho.
   */
  function _vigilarEstadosVacios() {
    if (typeof MutationObserver === 'undefined') return;
    const raiz = document.querySelector('main') || document.body;
    if (!raiz) return;
    let pendiente = 0;
    new MutationObserver(() => {
      clearTimeout(pendiente);
      pendiente = setTimeout(() => decorateEmptyStates(raiz), 80);
    }).observe(raiz, { childList: true, subtree: true });
  }

  /* ── Saludo del panel ──────────────────────────────────────────────────── */

  /**
   * Pone a Infy junto al mensaje de bienvenida del panel.
   * Se monta dentro de `[data-infy-greeting]` si existe.
   */
  function mountGreeting(host) {
    const destino = host || document.querySelector('[data-infy-greeting]');
    if (!destino || !_hayMascota() || destino.querySelector('.infy--greeting')) return null;

    /* Ansiosa: el saludo está en el primer visible del panel, y cargarlo
       tarde deja un hueco que empuja el titular. */
    const img = _img('IDLE', 'greeting', true);
    if (!img) return null;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    destino.insertBefore(img, destino.firstChild);
    return img;
  }

  /* ── Acceso rápido flotante ────────────────────────────────────────────── */

  /**
   * ¿Puede esta página atender el chat aquí mismo?
   *
   * Hace falta `GroqService` cargado y configurado. Donde no esté, el botón
   * lleva a la página de IA en vez de abrir un panel que no podría responder.
   */
  function _puedeChatarAqui() {
    return typeof GroqService !== 'undefined' && typeof GroqService.chatStream === 'function';
  }

  function _cerrarDrawer() {
    if (!_drawer) return;
    _drawer.classList.remove('is-open');
    _fab?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', _escape);
  }

  function _escape(e) {
    if (e.key === 'Escape') { _cerrarDrawer(); _fab?.focus(); }
  }

  /** Construye el panel la primera vez que alguien lo abre, no antes. */
  function _crearDrawer() {
    const caja = document.createElement('section');
    caja.className = 'infy-drawer';
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-modal', 'false');
    caja.setAttribute('aria-label', _t('ai.assistant', 'IN4MIND Assistant'));

    const cab = document.createElement('header');
    cab.className = 'infy-drawer__head';

    const avatar = _img('IDLE', 'drawer');
    if (avatar) { avatar.alt = ''; avatar.setAttribute('aria-hidden', 'true'); cab.appendChild(avatar); }

    const titulo = document.createElement('p');
    titulo.className = 'infy-drawer__title';
    titulo.textContent = _t('ai.assistant', 'IN4MIND Assistant');
    cab.appendChild(titulo);

    const abrir = document.createElement('a');
    abrir.className = 'infy-drawer__expand';
    abrir.href = 'ai.html';
    abrir.textContent = _t('infy.openFull', 'Abrir completo');
    cab.appendChild(abrir);

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'infy-drawer__close';
    cerrar.setAttribute('aria-label', _t('common.close', 'Cerrar'));
    cerrar.textContent = '×';
    cerrar.addEventListener('click', () => { _cerrarDrawer(); _fab?.focus(); });
    cab.appendChild(cerrar);

    const hilo = document.createElement('div');
    hilo.className = 'infy-drawer__thread';
    hilo.setAttribute('aria-live', 'polite');

    const form = document.createElement('form');
    form.className = 'infy-drawer__composer';

    const campo = document.createElement('input');
    campo.type = 'text';
    campo.className = 'infy-drawer__input';
    campo.setAttribute('aria-label', _t('ai.placeholder', 'Escribe tu pregunta'));
    campo.placeholder = _t('ai.placeholder', 'Escribe tu pregunta');

    const enviar = document.createElement('button');
    enviar.type = 'submit';
    enviar.className = 'infy-drawer__send';
    enviar.textContent = _t('ai.send', 'Enviar');

    form.append(campo, enviar);
    caja.append(cab, hilo, form);

    const burbuja = (quien, texto) => {
      const b = document.createElement('p');
      b.className = `infy-drawer__msg infy-drawer__msg--${quien}`;
      b.textContent = texto;            // texto del modelo: nunca como HTML
      hilo.appendChild(b);
      hilo.scrollTop = hilo.scrollHeight;
      return b;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pregunta = campo.value.trim();
      if (!pregunta) return;
      campo.value = '';
      burbuja('user', pregunta);

      /* El mismo evento que escucha el avatar de la cabecera: el panel no
         llama a la mascota, solo anuncia en qué está. */
      window.dispatchEvent(new CustomEvent('in4mind-ai-state', { detail: { state: 'thinking' } }));
      /* `typingAria` es la etiqueta que ya usa el indicador de "escribiendo"
         del chat: mismo significado, y así no se añade una clave gemela. */
      const respuesta = burbuja('bot', _t('ai.typingAria', 'Generando respuesta'));
      try {
        await GroqService.chatStream(
          [{ role: 'user', content: pregunta }],
          /* `chatStream` entrega el texto **acumulado** en cada paso, no el
             trozo nuevo: hay que asignarlo, no concatenarlo, o la respuesta
             sale repitiéndose sobre sí misma. */
          (acumulado) => {
            respuesta.textContent = acumulado;
            hilo.scrollTop = hilo.scrollHeight;
          },
        );
        window.dispatchEvent(new CustomEvent('in4mind-ai-state', { detail: { state: 'success' } }));
      } catch {
        respuesta.textContent = _t('ai.error', 'No he podido responder ahora mismo.');
        window.dispatchEvent(new CustomEvent('in4mind-ai-state', { detail: { state: 'error' } }));
      }
    });

    document.body.appendChild(caja);
    return caja;
  }

  function _abrirDrawer() {
    if (!_drawer) _drawer = _crearDrawer();
    _drawer.classList.add('is-open');
    _fab?.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', _escape);
    _drawer.querySelector('.infy-drawer__input')?.focus();
  }

  function toggleDrawer() {
    if (_drawer?.classList.contains('is-open')) _cerrarDrawer();
    else _abrirDrawer();
  }

  /**
   * Botón flotante con la cara de Infy.
   *
   * Va apilado **encima** de la burbuja del chat comunitario, que ya ocupaba
   * esa esquina: son dos cosas distintas —una habla con la IA y la otra con
   * el resto de estudiantes— y mover la que ya estaba confundiría a quien la
   * tenga aprendida.
   */
  function mountFab() {
    if (!_hayMascota() || _fab) return null;
    // En la propia página de IA no pinta nada: ya se está dentro del chat.
    if (document.querySelector('[data-infy-slot]')) return null;

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'infy-fab';
    boton.setAttribute('aria-label', _t('infy.openChat', 'Abrir el asistente'));

    const img = _img('IDLE', 'fab');
    if (img) { img.alt = ''; img.setAttribute('aria-hidden', 'true'); boton.appendChild(img); }

    boton.setAttribute('aria-haspopup', 'dialog');
    boton.setAttribute('aria-expanded', 'false');

    /* La decisión se toma al pulsar, no al montar.
       `GroqService` llega en su propia etiqueta y no hay garantía de que ya
       esté definido cuando se construye el botón; mirándolo aquí, el orden
       de carga deja de importar. */
    boton.addEventListener('click', () => {
      if (_puedeChatarAqui()) { toggleDrawer(); return; }
      /* Sin GroqService en esta página no hay con qué responder: se lleva a
         la página de IA en lugar de abrir un panel mudo. */
      window.location.href = 'ai.html';
    });

    document.body.appendChild(boton);
    _fab = boton;
    return boton;
  }

  function init() {
    mountGreeting();
    mountFab();
    decorateEmptyStates();
    _vigilarEstadosVacios();
  }

  return {
    init, showToast, renderCard, mountGreeting, mountFab, toggleDrawer,
    decorateEmptyStates,
  };

})();

if (typeof window !== 'undefined') {
  /* Nombre corto del encargo: `Infy.showToast(...)`, `Infy.renderCard(...)`. */
  window.Infy = MascotService;

  const boot = () => MascotService.init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

if (typeof module !== 'undefined') module.exports = MascotService;
