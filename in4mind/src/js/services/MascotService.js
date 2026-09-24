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

  /** ¿Es `clave` el nombre de un gesto de la mascota, y no un tipo de aviso? */
  function GESTO_VALIDO(clave) {
    return _hayMascota() && Boolean(InfyMascot.GESTOS[String(clave).toUpperCase()]);
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
   * Tipo de aviso → gesto de Infy.
   *
   * Los nombres de tipo son los del encargo; el gesto sale de aquí para que
   * quien avisa hable de lo que pasó ("success", "retry") y no de qué cara
   * poner.
   */
  const TIPOS = {
    success: 'SUCCESS',
    achievement: 'SUCCESS',
    streak: 'SUCCESS',
    error: 'LEARNING',
    retry: 'LEARNING',
    info: 'LEARNING',
    learning: 'LEARNING',
    thinking: 'THINKING',
  };

  /**
   * Aviso flotante con Infy: un logro, una racha, un módulo completado.
   *
   * Para texto sin mascota ya está `AppShell.showToast`; esto es para cuando
   * el gesto es parte del mensaje.
   *
   * Admite dos formas, porque el encargo pedía las dos:
   *   showToast('¡Pleno!', 'success')
   *   showToast({ message: '¡Pleno!', type: 'success', duration: 4000 })
   *
   * @param {string|{message:string, type?:string, duration?:number}} entrada
   * @param {string} [tipo]      cuando la entrada es texto
   * @param {number} [duracion]  cuando la entrada es texto
   */
  function showToast(entrada, tipo, duracion) {
    const opciones = (entrada && typeof entrada === 'object')
      ? entrada
      : { message: entrada, type: tipo, duration: duracion };

    const mensaje = opciones.message;
    const clave = String(opciones.type || 'success').toLowerCase();
    /* Se acepta también el nombre del gesto en crudo (`SUCCESS`), que es como
       lo llamaba la primera versión de esta función. */
    const gesto = TIPOS[clave] || (GESTO_VALIDO(clave) ? clave.toUpperCase() : 'SUCCESS');
    const espera = opciones.duration ?? AVISO_MS;

    if (!_hayMascota() || !mensaje) return null;

    clearTimeout(_avisoTimer);
    _aviso?.remove();

    const caja = document.createElement('div');
    caja.className = `infy-toast infy-toast--${clave}`;
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

    /* Celebrar de verdad: unas pocas piezas de confeti, creadas solo para el
       tipo que las pide y retiradas con el aviso. Es CSS puro —sin librería
       ni canvas— y se calla con `prefers-reduced-motion`. */
    if (gesto === 'SUCCESS') _confeti(caja);

    _avisoTimer = setTimeout(() => {
      caja.classList.remove('is-visible');
      setTimeout(() => { if (caja === _aviso) { caja.remove(); _aviso = null; } }, 260);
    }, espera);

    return caja;
  }

  /** Confeti ligero sobre el aviso; nada que limpiar aparte del propio aviso. */
  function _confeti(caja) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const capa = document.createElement('span');
    capa.className = 'infy-toast__confetti';
    capa.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 12; i += 1) {
      const p = document.createElement('i');
      /* La única propiedad en línea es la posición de cada pieza, que por
         definición no puede vivir en la hoja: el resto lo pone el CSS. */
      p.style.setProperty('--x', `${(i / 11) * 100}%`);
      p.style.setProperty('--d', `${(i % 4) * 90}ms`);
      capa.appendChild(p);
    }
    caja.appendChild(capa);
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
      /* Variante propia, no la de la tarjeta: el hueco del estado vacío
         mide 56 px y `.infy--card` son 112, que se salían por abajo y
         caían encima del titular. */
      const img = _img(icono.dataset.infyGesto || 'IDLE', 'empty');
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
      pendiente = setTimeout(() => {
        decorateEmptyStates(raiz);
        decorateOnboarding(document);   // el tour se monta en <body>, no en main
      }, 80);
    }).observe(raiz, { childList: true, subtree: true });
  }

  /* ── Saludo del panel ──────────────────────────────────────────────────── */

  /** Nombre de pila: el saludo con el nombre completo suena a carta del banco. */
  function _nombre() {
    try {
      const u = JSON.parse(sessionStorage.getItem('in4mind_user') || 'null');
      const bruto = u?.name || u?.email?.split('@')[0] || '';
      return String(bruto).trim().split(/\s+/)[0] || '';
    } catch { return ''; }
  }

  /** Días seguidos estudiando, si la app lleva la cuenta. */
  function _racha() {
    if (typeof GamificationService === 'undefined') return 0;
    try { return Number(GamificationService.getStreak()) || 0; } catch { return 0; }
  }

  /**
   * Qué dice Infy al abrir el panel.
   *
   * La racha manda sobre la hora: que alguien lleve días seguidos es más
   * relevante que si son las diez o las seis, y celebrarlo es justo lo que
   * sostiene el hábito. Si no hay racha, saluda según el momento del día.
   *
   * @returns {{ gesto: string, texto: string }}
   */
  function greetingFor(hora = new Date().getHours(), racha = _racha(), nombre = _nombre()) {
    if (racha > 0) {
      return {
        gesto: 'SUCCESS',
        texto: _t('infy.greetStreak', `¡Llevas ${racha} días seguidos estudiando! ¡Sigue así!`, { n: racha }),
      };
    }
    const momento = (hora >= 5 && hora < 12) ? 'Morning' : 'Later';
    const porDefecto = momento === 'Morning'
      ? `¡Buenos días${nombre ? `, ${nombre}` : ''}! ¿Empezamos con un repaso hoy?`
      : `¡Buenas tardes${nombre ? `, ${nombre}` : ''}! Continuemos donde lo dejaste.`;
    /* Quien acaba de registrarse puede no tener nombre todavía. La frase
       traducida lleva la coma pegada a `{name}`, así que sin una variante
       propia saldría "¡Buenos días, !": hay una clave por cada caso. */
    const clave = `infy.greet${momento}${nombre ? '' : 'Anon'}`;
    return {
      gesto: 'IDLE',
      texto: _t(clave, porDefecto, { name: nombre }),
    };
  }

  /**
   * Pone a Infy junto al mensaje de bienvenida del panel, con su saludo.
   * Se monta dentro de `[data-infy-greeting]` si existe.
   */
  function mountGreeting(host) {
    const destino = host || document.querySelector('[data-infy-greeting]');
    if (!destino || !_hayMascota() || destino.querySelector('.infy--greeting')) return null;

    const saludo = greetingFor();

    /* Ansiosa: el saludo está en el primer visible del panel, y cargarlo
       tarde deja un hueco que empuja el titular. */
    const img = _img(saludo.gesto, 'greeting', true);
    if (!img) return null;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    destino.insertBefore(img, destino.firstChild);

    /* El saludo va en su propia línea, debajo del subtítulo que ya estaba: no
       se pisa el titular de bienvenida, que lo escribe el panel. */
    const bloque = destino.querySelector('.welcome-section__text') || destino;
    if (!bloque.querySelector('.infy-greeting__line')) {
      const p = document.createElement('p');
      p.className = 'infy-greeting__line';
      p.textContent = saludo.texto;
      bloque.appendChild(p);
    }

    return img;
  }

  /**
   * Infy en el tour de bienvenida.
   *
   * El tour ya existe en `AppFeatures` —pasos, Omitir/Siguiente y su marca en
   * `localStorage`—, así que aquí solo se le pone cara. Montar un segundo
   * tour habría dado dos superposiciones en el primer inicio de sesión.
   *
   * El hueco (`[data-infy-onboard]`) aparece cuando el tour se abre, no en el
   * arranque, así que lo recoge el mismo observador que los estados vacíos.
   */
  function decorateOnboarding(raiz = document) {
    if (!_hayMascota()) return 0;
    let n = 0;
    for (const hueco of raiz.querySelectorAll('[data-infy-onboard]')) {
      if (hueco.dataset.infyDone === '1') continue;
      const img = _img('IDLE', 'onboard');
      if (!img) continue;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      hueco.appendChild(img);
      hueco.dataset.infyDone = '1';
      n += 1;
    }
    return n;
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

    /* Globo de ayuda. Va en el propio botón y no como `title` del navegador
       para poder darle forma y para que aparezca al instante. `aria-label` ya
       nombra el botón, así que esto es decorativo y no se anuncia dos veces. */
    const globo = document.createElement('span');
    globo.className = 'infy-fab__tip';
    globo.setAttribute('aria-hidden', 'true');
    globo.textContent = _t('infy.fabTip', '¿Necesitas ayuda con este tema?');
    boton.appendChild(globo);

    /* Al pasar por encima, Infy pone cara de pensar: la mascota responde antes
       de que se le pregunte nada. Se vuelve a la calma al salir. */
    if (img) {
      const gestoAl = (g) => {
        img.src = InfyMascot.RUTA + InfyMascot.GESTOS[g];
        img.dataset.gesto = g;
      };
      boton.addEventListener('mouseenter', () => gestoAl('THINKING'));
      boton.addEventListener('focus', () => gestoAl('THINKING'));
      boton.addEventListener('mouseleave', () => gestoAl('IDLE'));
      boton.addEventListener('blur', () => gestoAl('IDLE'));
    }

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
    decorateOnboarding();
    _vigilarEstadosVacios();
  }

  return {
    init, showToast, renderCard, mountGreeting, mountFab, toggleDrawer,
    decorateEmptyStates, decorateOnboarding, greetingFor,
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
