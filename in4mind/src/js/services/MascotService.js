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


  /* ── Tour de primeros pasos ────────────────────────────────────────────── */

  /**
   * Guía de tres pasos la primera vez que alguien entra al panel.
   *
   * No usa `alert()` ni cambia de página: se oscurece todo menos el elemento
   * del paso y se explica al lado. Si el elemento de un paso no está en esta
   * pantalla —el grafo de habilidades vive en el perfil, no en el panel— el
   * paso se cuenta igual pero sin foco, en lugar de señalar al vacío.
   *
   * La marca de "ya visto" es por usuario y local: es una ayuda de interfaz,
   * no un dato que merezca un viaje a la base de datos ni bloquear el panel.
   */
  const TOUR_KEY = 'in4mind_tour_visto';

  function _clavePorUsuario() {
    let quien = '';
    try {
      if (typeof UserProfileService !== 'undefined') {
        quien = UserProfileService.getCurrentUser()?.email || '';
      }
    } catch { /* sin perfil: clave global */ }
    return quien ? `${TOUR_KEY}:${quien.toLowerCase()}` : TOUR_KEY;
  }

  function tourVisto() {
    try { return localStorage.getItem(_clavePorUsuario()) === '1'; }
    catch { return true; }   // sin almacenamiento, no se insiste
  }

  function marcarTourVisto() {
    try { localStorage.setItem(_clavePorUsuario(), '1'); } catch { /* ignore */ }
  }

  function _pasos() {
    return [
      {
        objetivo: '#recent-track, #learning-paths-grid, .resume-grid',
        texto: _t('tour.paso1', 'Aquí puedes ver tus cursos activos.'),
      },
      {
        objetivo: '[data-skill-graph], [data-skill-graph-section]',
        texto: _t('tour.paso2', 'En esta sección puedes ver tu grafo de habilidades 3D.'),
      },
      {
        objetivo: '.infy-fab',
        texto: _t('tour.paso3', 'Y si tienes cualquier duda, ¡haz clic sobre mí para abrir el chat de IA!'),
      },
    ];
  }

  function startTour({ forzar = false } = {}) {
    if (!forzar && tourVisto()) return;
    if (document.querySelector('.infy-tour')) return;   // ya hay uno abierto

    const pasos = _pasos();
    let indice = 0;
    let objetivo = null;
    let rafSeguir = 0;

    const capa = document.createElement('div');
    capa.className = 'infy-tour';
    capa.setAttribute('role', 'dialog');
    capa.setAttribute('aria-modal', 'true');
    capa.setAttribute('aria-label', _t('tour.titulo', 'Primeros pasos'));

    const foco = document.createElement('div');
    foco.className = 'infy-tour__foco';
    foco.hidden = true;

    const globo = document.createElement('div');
    globo.className = 'infy-tour__globo';

    const avatar = _img('IDLE', 'md', true);
    if (avatar) {
      avatar.className = 'infy-tour__avatar';
      globo.appendChild(avatar);
    }

    const texto = document.createElement('p');
    texto.className = 'infy-tour__texto';
    globo.appendChild(texto);

    const pie = document.createElement('div');
    pie.className = 'infy-tour__pie';

    const cuenta = document.createElement('span');
    cuenta.className = 'infy-tour__cuenta';

    const saltar = document.createElement('button');
    saltar.type = 'button';
    saltar.className = 'infy-tour__btn infy-tour__btn--ghost';
    saltar.textContent = _t('tour.saltar', 'Saltar tour');

    const siguiente = document.createElement('button');
    siguiente.type = 'button';
    siguiente.className = 'infy-tour__btn infy-tour__btn--primary';

    pie.append(cuenta, saltar, siguiente);
    globo.appendChild(pie);
    capa.append(foco, globo);
    document.body.appendChild(capa);

    function cerrar() {
      marcarTourVisto();
      cancelarSeguimiento();
      window.removeEventListener('keydown', alTeclado);
      window.removeEventListener('resize', recolocar);
      window.removeEventListener('scroll', recolocar);
      capa.remove();
    }

    function alTeclado(ev) {
      if (ev.key === 'Escape') cerrar();
      else if (ev.key === 'Enter' && document.activeElement === capa) avanzar();
    }

    function avanzar() {
      indice += 1;
      if (indice >= pasos.length) { cerrar(); return; }
      pintar();
    }

    function pintar() {
      const paso = pasos[indice];
      texto.textContent = paso.texto;
      cuenta.textContent = `${indice + 1}/${pasos.length}`;
      siguiente.textContent = indice === pasos.length - 1
        ? _t('tour.entendido', 'Entendido')
        : _t('tour.siguiente', 'Siguiente');

      const el = document.querySelector(paso.objetivo);
      objetivo = el || null;
      if (!el) {
        // Sin objetivo en esta pantalla: el globo se centra y no hay foco.
        cancelarSeguimiento();
        foco.hidden = true;
        globo.classList.add('infy-tour__globo--centrado');
        globo.style.removeProperty('top');
        globo.style.removeProperty('left');
        return;
      }

      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      /* `scrollIntoView` suave es asíncrono: medir justo aquí devuelve la
         posición de ANTES del scroll, y el foco se queda anclado a ella
         —fuera de pantalla si el objetivo estaba bajo la línea de flotación—.
         Se coloca ya (por si no había nada que scrollear) y luego se sigue al
         objetivo hasta que la animación lo deja quieto. */
      recolocar();
      seguir();
    }

    /** Coloca foco y globo sobre el objetivo, sin tocar el scroll. */
    function recolocar() {
      if (!objetivo || !objetivo.isConnected) return;
      const r = objetivo.getBoundingClientRect();
      const margen = 8;
      foco.hidden = false;
      foco.style.top = `${r.top - margen}px`;
      foco.style.left = `${r.left - margen}px`;
      foco.style.width = `${r.width + margen * 2}px`;
      foco.style.height = `${r.height + margen * 2}px`;

      globo.classList.remove('infy-tour__globo--centrado');
      // Debajo del elemento, salvo que no quepa; entonces encima.
      const alto = globo.offsetHeight || 150;
      const cabeDebajo = r.bottom + alto + 24 < window.innerHeight;
      globo.style.top = cabeDebajo ? `${r.bottom + 16}px` : `${Math.max(12, r.top - alto - 16)}px`;
      globo.style.left = `${Math.max(12, Math.min(r.left, window.innerWidth - (globo.offsetWidth || 300) - 12))}px`;
    }

    /* Se para cuando el objetivo lleva tres fotogramas quieto, y como mucho
       tras 1,2 s: el usuario puede cortar el scroll, y hay navegadores que
       ignoran `smooth` y saltan de golpe. */
    function seguir() {
      cancelarSeguimiento();
      const limite = performance.now() + 1200;
      let anterior = null;
      let quietos = 0;
      const tic = () => {
        if (!objetivo || !objetivo.isConnected) { rafSeguir = 0; return; }
        const y = objetivo.getBoundingClientRect().top;
        quietos = (anterior !== null && Math.abs(y - anterior) < 0.5) ? quietos + 1 : 0;
        anterior = y;
        recolocar();
        rafSeguir = (quietos >= 3 || performance.now() > limite) ? 0 : requestAnimationFrame(tic);
      };
      rafSeguir = requestAnimationFrame(tic);
    }

    function cancelarSeguimiento() {
      if (rafSeguir) { cancelAnimationFrame(rafSeguir); rafSeguir = 0; }
    }

    saltar.addEventListener('click', cerrar);
    siguiente.addEventListener('click', avanzar);
    window.addEventListener('keydown', alTeclado);
    // Recolocan, no re-scrollean: perseguir al usuario mientras mueve la
    // página sería pelearse con él.
    window.addEventListener('resize', recolocar);
    window.addEventListener('scroll', recolocar, { passive: true });

    capa.tabIndex = -1;
    capa.focus();
    pintar();
  }

  function init() {
    mountGreeting();
    mountFab();
    decorateEmptyStates();
    _vigilarEstadosVacios();

    /* El tour se lanza tras el primer pintado: antes, los elementos que
       señala todavía no existen —el panel los rellena por JavaScript— y el
       foco se colocaría sobre huecos vacíos. */
    if (document.querySelector('#recent-track, #learning-paths-grid')) {
      setTimeout(() => startTour(), 1200);
    }
  }

  return {
    init, showToast, renderCard, mountGreeting, mountFab, toggleDrawer,
    decorateEmptyStates, startTour, tourVisto, marcarTourVisto,
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
