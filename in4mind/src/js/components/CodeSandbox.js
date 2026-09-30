/**
 * IN4MIND — Editor de código con ejecución aislada y diagnóstico de Infy.
 *
 * Tres piezas:
 *   1. Un editor (CodeMirror 6, cargado en diferido desde jsDelivr).
 *   2. Un ejecutor aislado: `sandbox-runner.html` dentro de un
 *      `<iframe sandbox="allow-scripts">`. Sin `allow-same-origin` el documento
 *      recibe un origen opaco: no puede leer cookies, ni localStorage, ni el
 *      token de Supabase, ni tocar el DOM de la página. Solo `postMessage`.
 *   3. Infy: cuando la ejecución falla, manda el código y el error a
 *      `/api/groq/chat` y enseña la explicación en un cajón lateral.
 *
 * Nada de esto se descarga al abrir la página. El editor solo se pide cuando
 * hay un sandbox en pantalla, y el intérprete de Python (~10 MB) únicamente si
 * el ejercicio es de Python y el alumno pulsa Ejecutar.
 */

'use strict';

const CodeSandbox = (() => {

  const RUNNER = 'sandbox-runner.html';

  /* CodeMirror 5, vendorizado en `src/js/vendor/codemirror/`.
   *
   * Se intentó CodeMirror 6 primero, que es lo que se pidió, por dos vías:
   * los bundles `/+esm` de jsDelivr y `esm.sh` con dependencias fijadas. Las
   * dos fallan por el mismo motivo de fondo: cada paquete de CM6 arrastra su
   * propia copia de `@codemirror/state`, y las comprobaciones `instanceof`
   * entre instancias distintas revientan ("Unrecognized extension value…").
   * Cuadrar las versiones a mano funciona hasta que una de ellas publica una
   * menor, y entonces el editor deja de abrirse en producción.
   *
   * CM5 es un script clásico de un solo fichero —como todo el resto de este
   * proyecto—, pesa 58 KB comprimido y trae lo que hacía falta: resaltado,
   * números de línea y autocierre de etiquetas. */
  const CM_BASE = 'src/js/vendor/codemirror/';
  const CM_FICHEROS = [
    'codemirror.min.js',
    'xml.min.js', 'javascript.min.js', 'css.min.js',
    'htmlmixed.min.js', 'python.min.js',
    'closetag.min.js', 'closebrackets.min.js',
  ];

  /* Retratos de Infy, los mismos que usa el resto de la plataforma. Si alguno
     faltara, la imagen no se pinta y queda el texto, que es lo que importa. */
  const INFY = {
    pensando: 'src/img/infy/infy-pensando.png',
    leyendo: 'src/img/infy/infy-leyendo.png',
    celebrando: 'src/img/infy/infy-celebrando.png',
  };

  const LIMITE_MS = 6000;        // corte por bucle infinito
  /* Descargar Pyodide son ~10 MB desde el CDN. En una conexión de móvil lenta
     pasa del minuto sin que nada vaya mal, así que su espera se mide aparte y
     con mucho más margen que la ejecución. */
  const ARRANQUE_MS = 120000;
  const MAX_LINEAS_CONSOLA = 300;

  let _cm = null;                // módulos de CodeMirror ya cargados
  const _instancias = new Map(); // nodo raíz -> estado

  function _t(clave, params, respaldo) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(clave, params);
      if (out && out !== clave) return out;
    }
    return respaldo;
  }

  /* ── Carga del editor ────────────────────────────────────────────────────── */

  function _cargarScript(url) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = res;
      s.onerror = () => rej(new Error(`No se pudo cargar ${url}`));
      document.head.appendChild(s);
    });
  }

  /**
   * Trae CodeMirror la primera vez que hace falta.
   *
   * Los ficheros van en serie a propósito: los modos y los complementos se
   * registran sobre el objeto global `CodeMirror`, así que el núcleo tiene que
   * estar antes. En paralelo fallarían de forma intermitente.
   */
  async function _cargarEditor() {
    if (_cm) return _cm;
    if (typeof CodeMirror === 'undefined') {
      if (!document.querySelector('link[data-cm-css]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = `${CM_BASE}codemirror.css`;
        l.dataset.cmCss = '1';
        document.head.appendChild(l);
      }
      for (const f of CM_FICHEROS) {
        await _cargarScript(CM_BASE + f);
      }
    }
    _cm = window.CodeMirror;
    return _cm;
  }

  /** Modo de CodeMirror para cada pestaña. */
  function _modoDe(clave) {
    if (clave === 'python') return 'python';
    if (clave === 'html') return 'htmlmixed';
    if (clave === 'css') return 'css';
    return 'javascript';
  }

  /* ── Terminal ────────────────────────────────────────────────────────────── */

  function _escribirConsola(est, nivel, texto) {
    const linea = document.createElement('div');
    linea.className = `sbx-term__line sbx-term__line--${nivel}`;
    linea.textContent = texto;
    est.$term.appendChild(linea);

    // Se recorta por arriba: con un bucle largo, el DOM crecería sin control.
    while (est.$term.childElementCount > MAX_LINEAS_CONSOLA) {
      est.$term.removeChild(est.$term.firstElementChild);
    }
    est.$term.scrollTop = est.$term.scrollHeight;
  }

  function _limpiarConsola(est) {
    est.$term.textContent = '';
  }

  /* ── Estado de Infy ──────────────────────────────────────────────────────── */

  function _infy(est, estado, texto) {
    const src = INFY[estado] || '';
    est.$infyImg.src = src;
    est.$infyImg.hidden = !src;
    est.$infyTexto.textContent = texto || '';
    est.$infy.hidden = !texto;
    est.$infy.dataset.estado = estado || '';
  }

  function _abrirCajon(est, contenido) {
    est.$cajonCuerpo.textContent = contenido;
    est.$cajon.hidden = false;
    // El foco va al cajón para que quien navegue por teclado lo encuentre.
    est.$cajonCerrar.focus();
  }

  function _cerrarCajon(est) {
    est.$cajon.hidden = true;
    est.$infyImg.src = INFY.pensando;
  }

  /* ── Diagnóstico con Infy ────────────────────────────────────────────────── */

  /**
   * Manda el código y el error al asistente y enseña la explicación.
   *
   * El prompt pide explícitamente que NO dé la solución: si la da, el alumno
   * copia y pega y no aprende nada, que es justo lo contrario de para qué
   * está esto aquí.
   */
  async function _pedirDiagnostico(est, error) {
    if (est.diagnosticando) return;
    est.diagnosticando = true;

    _infy(est, 'pensando', _t('sandbox.infyPensando', null,
      '¡Ups! Encontré un detalle en tu código. Permíteme analizarlo…'));

    const sistema = [
      'Eres Infy, el asistente de IN4MIND.',
      'Explica el error a un estudiante en términos sencillos y alentadores, en español.',
      'Máximo 80 palabras.',
      'NO des la solución completa: guíale para que la encuentre él mismo.',
    ].join(' ');

    const cuerpo = [
      `Lenguaje: ${est.lenguaje}`,
      '',
      'Código del estudiante:',
      '```',
      est.codigoActual().slice(0, 4000),
      '```',
      '',
      'Error obtenido:',
      '```',
      `${error.mensaje || ''}\n${error.pila || ''}`.slice(0, 1200),
      '```',
    ].join('\n');

    try {
      const token = await _tokenSupabase();
      const res = await fetch('/api/groq/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          systemPrompt: sistema,
          history: [{ role: 'user', content: cuerpo }],
          max_tokens: 300,
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        const datos = await res.json().catch(() => ({}));
        throw new Error(datos.error || `HTTP ${res.status}`);
      }

      const datos = await res.json();
      const respuesta = (datos.reply || '').trim();
      _infy(est, 'leyendo', _t('sandbox.infyListo', null, 'Infy revisó tu código:'));
      _abrirCajon(est, respuesta || _t('sandbox.infySinRespuesta', null,
        'No conseguí analizarlo esta vez. Revisa el mensaje de error de la terminal.'));
    } catch (err) {
      /* Que falle el asistente no puede tapar el error real: el alumno sigue
         teniendo el mensaje en la terminal, que es lo importante. */
      const motivo = String(err && err.message) === 'UNAUTHENTICATED'
        ? _t('sandbox.infySesion', null, 'Inicia sesión para que Infy pueda ayudarte.')
        : _t('sandbox.infyNoDisponible', null, 'Infy no está disponible ahora mismo.');
      _infy(est, 'pensando', motivo);
    } finally {
      est.diagnosticando = false;
    }
  }

  async function _tokenSupabase() {
    try {
      if (typeof _sbClient === 'undefined' || !_sbClient?.auth) return '';
      const { data } = await _sbClient.auth.getSession();
      return data?.session?.access_token || '';
    } catch {
      return '';
    }
  }

  /* ── Ejecución ───────────────────────────────────────────────────────────── */

  /**
   * Rehace el iframe en cada ejecución.
   *
   * Reutilizarlo parecía más eficiente, pero el código anterior deja detrás
   * temporizadores, listeners y referencias que siguen vivos: al tercer o
   * cuarto "Ejecutar" con un `setInterval` suelto, la pestaña se arrastra.
   * Destruirlo y crearlo de nuevo garantiza que cada ejecución empieza limpia.
   */
  function _nuevoIframe(est) {
    if (est.$iframe) {
      est.$iframe.remove();
      est.$iframe = null;
    }
    clearTimeout(est.temporizador);

    const f = document.createElement('iframe');
    f.className = 'sbx-preview__frame';
    /* Sin `allow-same-origin`: el documento queda con origen opaco y no puede
       tocar cookies, almacenamiento ni el DOM de IN4MIND. */
    f.setAttribute('sandbox', 'allow-scripts');
    f.setAttribute('title', _t('sandbox.previewTitle', null, 'Vista previa del código'));
    f.src = RUNNER;
    est.$preview.appendChild(f);
    est.$iframe = f;
    return f;
  }

  function _ejecutarWeb(est) {
    _limpiarConsola(est);
    _cerrarCajon(est);
    _infy(est, '', '');
    est.huboError = false;

    const f = _nuevoIframe(est);

    /* Dos disparadores para el mismo envío, y solo gana el primero.
     *
     * El ejecutor saluda con `listo` en cuanto su script arranca, que es la
     * vía normal. Pero ese saludo puede perderse —por ejemplo si el navegador
     * retrasa la ejecución del subframe mientras la pestaña no se está
     * pintando—, y entonces el alumno pulsaría Ejecutar y no pasaría nada.
     * El evento `load` del iframe sirve de red de seguridad. */
    let enviado = false;
    const enviarCodigo = () => {
      if (enviado || !f.contentWindow) return;
      enviado = true;
      window.removeEventListener('message', alListo);
      f.contentWindow.postMessage({
        in4mind: true, tipo: 'ejecutar', codigo: est.codigo(),
      }, '*');
    };

    const alListo = (ev) => {
      if (ev.source !== f.contentWindow) return;
      const d = ev.data;
      if (!d || d.in4mind !== true || d.tipo !== 'listo') return;
      enviarCodigo();
    };
    window.addEventListener('message', alListo);

    // El `load` llega cuando el documento está cargado; un respiro para que su
    // script haya terminado de instalar el receptor de mensajes.
    f.addEventListener('load', () => setTimeout(enviarCodigo, 60), { once: true });

    // Corte por bucle infinito: el iframe no responde y hay que tirarlo.
    est.temporizador = setTimeout(() => {
      if (est.terminado) return;
      _escribirConsola(est, 'error', _t('sandbox.timeout', null,
        'La ejecución tardó demasiado y se detuvo. ¿Hay un bucle sin fin?'));
      _nuevoIframe(est);
    }, LIMITE_MS);
  }

  /* ── Python ──────────────────────────────────────────────────────────────── */

  /**
   * Python corre en un Web Worker con Pyodide.
   *
   * En el hilo principal, un `while True` del alumno congelaría la pestaña
   * entera —ni siquiera se podría pulsar "Reiniciar"—. En un worker, la página
   * sigue respondiendo y basta con terminarlo.
   */
  function _crearWorker(est) {
    est.worker = new Worker('src/js/workers/python-worker.js');
    est.worker.addEventListener('message', (ev) => _mensajeWorker(est, ev.data));
    est.worker.addEventListener('error', () => {
      _escribirConsola(est, 'error', _t('sandbox.pythonFallo', null,
        'No se pudo iniciar Python en este navegador.'));
    });
  }

  /**
   * Empieza a bajar Pyodide en cuanto el alumno toca el editor.
   *
   * Tocar el editor es la señal de que va a ejecutar algo, así que los 10 MB
   * viajan mientras escribe en lugar de cuando ya está mirando la terminal en
   * blanco. Si no llega a pulsar «Ejecutar» no se ha perdido nada; si pulsa,
   * la descarga ya va por delante.
   *
   * No se hace al montar el sandbox: eso descargaría 10 MB a todo el que
   * simplemente pasa por una lección de Python.
   */
  function _precalentarPython(est) {
    if (est.lenguaje !== 'python' || est.worker) return;
    // `saveData` es el usuario pidiendo explícitamente que no gastemos sus datos.
    if (navigator.connection && navigator.connection.saveData) return;
    _crearWorker(est);
    est.worker.postMessage({ tipo: 'precalentar' });
  }

  function _ejecutarPython(est) {
    _limpiarConsola(est);
    _cerrarCajon(est);
    est.huboError = false;

    if (!est.worker) {
      _escribirConsola(est, 'log', _t('sandbox.cargandoPython', null,
        'Preparando Python… (la primera vez tarda unos segundos)'));
      _crearWorker(est);
    }

    /* Dos relojes, porque miden cosas distintas. Descargar Pyodide son ~10 MB
       y en una conexión lenta puede pasar del minuto; el código de una lección
       tiene que acabar en segundos. Con un solo reloj —como estaba— una
       descarga lenta se acusaba de «bucle sin fin» y además mataba el worker
       a media descarga, así que el siguiente intento volvía a empezar. */
    est.ejecutando = true;
    clearTimeout(est.temporizador);
    est.temporizador = setTimeout(() => {
      est.worker?.terminate();
      est.worker = null;
      est.ejecutando = false;
      _escribirConsola(est, 'error', _t('sandbox.pythonLento', null,
        'Python está tardando demasiado en descargarse. Revisa tu conexión e inténtalo otra vez.'));
    }, ARRANQUE_MS);

    est.worker.postMessage({ tipo: 'ejecutar', codigo: est.codigo().python || '' });
  }

  function _mensajeWorker(est, d) {
    if (!d) return;
    if (d.tipo === 'listo') {
      /* El precalentado también avisa cuando termina, y entonces no hay nada
         que cronometrar: arrancar aquí el reloj de ejecución mataría el worker
         a los segundos sin que el alumno hubiera pulsado nada. */
      if (!est.ejecutando) return;
      /* Pyodide ya está en memoria: se cambia el reloj de descarga por el de
         ejecución, que es el que de verdad caza un bucle infinito. */
      clearTimeout(est.temporizador);
      est.temporizador = setTimeout(() => {
        // Terminar el worker es la única forma de parar un bucle infinito.
        est.worker?.terminate();
        est.worker = null;
        est.ejecutando = false;
        _escribirConsola(est, 'error', _t('sandbox.timeout', null,
          'La ejecución tardó demasiado y se detuvo. ¿Hay un bucle sin fin?'));
      }, LIMITE_MS * 2);
      return;
    }
    if (d.tipo === 'salida') {
      _escribirConsola(est, d.nivel || 'log', d.texto);
    } else if (d.tipo === 'error') {
      est.huboError = true;
      _escribirConsola(est, 'error', d.mensaje);
      _pedirDiagnostico(est, { mensaje: d.mensaje, pila: d.traza || '' });
      clearTimeout(est.temporizador);
      est.ejecutando = false;
    } else if (d.tipo === 'fin') {
      clearTimeout(est.temporizador);
      est.ejecutando = false;
      _alTerminar(est);
    }
  }

  /* ── Resultado ───────────────────────────────────────────────────────────── */

  function _alTerminar(est) {
    est.terminado = true;
    if (est.huboError) return;
    _infy(est, 'celebrando', _t('sandbox.sinErrores', null,
      '¡Excelente código! Sin errores de ejecución.'));
    if (typeof AppFeatures !== 'undefined' && AppFeatures.toast) {
      AppFeatures.toast(_t('sandbox.sinErrores', null, '¡Excelente código! Sin errores de ejecución.'), 'success');
    }
  }

  function _alMensaje(est, ev) {
    if (!est.$iframe || ev.source !== est.$iframe.contentWindow) return;
    const d = ev.data;
    if (!d || d.in4mind !== true) return;

    if (d.tipo === 'consola') {
      _escribirConsola(est, d.nivel, d.texto);
    } else if (d.tipo === 'error') {
      est.huboError = true;
      const donde = d.linea ? ` (línea ${d.linea})` : '';
      _escribirConsola(est, 'error', `${d.mensaje}${donde}`);
      clearTimeout(est.temporizador);
      _pedirDiagnostico(est, d);
    } else if (d.tipo === 'fin') {
      clearTimeout(est.temporizador);
      _alTerminar(est);
    }
  }

  /* ── Construcción ────────────────────────────────────────────────────────── */

  function _plantilla(lenguaje) {
    const pestanas = lenguaje === 'python'
      ? ['python']
      : ['html', 'css', 'js'];

    return `
      <div class="sbx__panel sbx__panel--editor">
        <div class="sbx__tabs" role="tablist">
          ${pestanas.map((p, i) => `
            <button type="button" class="sbx__tab${i === 0 ? ' is-active' : ''}"
                    role="tab" data-lang="${p}" aria-selected="${i === 0}">${p.toUpperCase()}</button>
          `).join('')}
        </div>
        <div class="sbx__editor" data-editor></div>
        <div class="sbx__actions">
          <button type="button" class="sbx__btn sbx__btn--run" data-run>
            ${_t('sandbox.run', null, 'Ejecutar')}
          </button>
          <button type="button" class="sbx__btn" data-reset>
            ${_t('sandbox.reset', null, 'Reiniciar')}
          </button>
          <button type="button" class="sbx__btn sbx__btn--infy" data-ask>
            ${_t('sandbox.askInfy', null, 'Pedir ayuda a Infy')}
          </button>
        </div>
      </div>

      <div class="sbx__panel sbx__panel--salida">
        <div class="sbx__infy" data-infy hidden>
          <img class="sbx__infy-img" data-infy-img alt="" width="40" height="40" hidden>
          <p class="sbx__infy-text" data-infy-text></p>
        </div>
        <div class="sbx-preview" data-preview></div>
        <div class="sbx-term" data-term role="log" aria-live="polite"
             aria-label="${_t('sandbox.console', null, 'Consola')}"></div>
      </div>

      <aside class="sbx-drawer" data-drawer hidden aria-label="${_t('sandbox.infyTitle', null, 'Diagnóstico de Infy')}">
        <header class="sbx-drawer__head">
          <img src="${INFY.leyendo}" alt="" width="32" height="32" onerror="this.hidden=true">
          <strong>${_t('sandbox.infyTitle', null, 'Diagnóstico de Infy')}</strong>
          <button type="button" class="sbx-drawer__close" data-drawer-close
                  aria-label="${_t('common.close', null, 'Cerrar')}">×</button>
        </header>
        <div class="sbx-drawer__body" data-drawer-body></div>
      </aside>
    `;
  }

  /**
   * Monta un sandbox dentro de un contenedor.
   *
   * @param {HTMLElement} raiz
   * @param {{lenguaje?: string, inicial?: object}} opciones
   */
  async function mount(raiz, opciones = {}) {
    if (!raiz || _instancias.has(raiz)) return;

    const lenguaje = opciones.lenguaje === 'python' ? 'python' : 'web';
    const inicial = opciones.inicial || {};

    raiz.classList.add('sbx');
    raiz.dataset.lang = lenguaje;
    raiz.innerHTML = _plantilla(lenguaje);

    const est = {
      raiz, lenguaje,
      $preview: raiz.querySelector('[data-preview]'),
      $term: raiz.querySelector('[data-term]'),
      $infy: raiz.querySelector('[data-infy]'),
      $infyImg: raiz.querySelector('[data-infy-img]'),
      $infyTexto: raiz.querySelector('[data-infy-text]'),
      $cajon: raiz.querySelector('[data-drawer]'),
      $cajonCuerpo: raiz.querySelector('[data-drawer-body]'),
      $cajonCerrar: raiz.querySelector('[data-drawer-close]'),
      $iframe: null,
      worker: null,
      temporizador: 0,
      vistas: {},        // lenguaje -> EditorView
      activo: lenguaje === 'python' ? 'python' : 'html',
      inicial,
      huboError: false,
      terminado: false,
      diagnosticando: false,
      ejecutando: false,   // hay código del alumno en marcha (no precalentado)
    };

    est.codigo = () => {
      const leer = (k) => {
        const v = est.vistas[k];
        if (!v) return inicial[k] || '';
        // CM5 expone getValue(); el respaldo es un textarea.
        return v.getValue ? v.getValue() : (v._ta ? v._ta.value : '');
      };
      return lenguaje === 'python'
        ? { python: leer('python') }
        : { html: leer('html'), css: leer('css'), js: leer('js') };
    };
    est.codigoActual = () => {
      const c = est.codigo();
      return Object.entries(c).map(([k, v]) => `--- ${k} ---\n${v}`).join('\n\n');
    };

    _instancias.set(raiz, est);

    // Editor
    const $ed = raiz.querySelector('[data-editor]');
    try {
      const CM = await _cargarEditor();
      const claves = lenguaje === 'python' ? ['python'] : ['html', 'css', 'js'];
      for (const clave of claves) {
        const cont = document.createElement('div');
        cont.className = 'sbx__editor-pane';
        cont.hidden = clave !== est.activo;
        $ed.appendChild(cont);

        est.vistas[clave] = CM(cont, {
          value: inicial[clave] || '',
          mode: _modoDe(clave),
          lineNumbers: true,
          autoCloseTags: true,
          autoCloseBrackets: true,
          indentUnit: 2,
          tabSize: 2,
          lineWrapping: true,
          // El editor arranca oculto en las pestañas no activas y CM mide mal
          // el alto en ese caso; se refresca al mostrarlo (ver más abajo).
          viewportMargin: Infinity,
        });
      }
    } catch {
      /* Sin editor no se puede hacer nada útil, pero tampoco debe quedar una
         caja vacía: se deja un textarea sencillo como respaldo. */
      $ed.innerHTML = '';
      const claves = lenguaje === 'python' ? ['python'] : ['html', 'css', 'js'];
      for (const clave of claves) {
        const ta = document.createElement('textarea');
        ta.className = 'sbx__editor-fallback';
        ta.value = inicial[clave] || '';
        ta.hidden = clave !== est.activo;
        ta.spellcheck = false;
        $ed.appendChild(ta);
        est.vistas[clave] = { _ta: ta };
      }
    }

    // Pestañas
    raiz.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        est.activo = btn.dataset.lang;
        raiz.querySelectorAll('[data-lang]').forEach((b) => {
          const act = b === btn;
          b.classList.toggle('is-active', act);
          b.setAttribute('aria-selected', String(act));
        });
        const claves = lenguaje === 'python' ? ['python'] : ['html', 'css', 'js'];
        [...$ed.children].forEach((pane, i) => {
          pane.hidden = claves[i] !== est.activo;
        });
        /* CM calcula el alto al crearse; si nació oculto lo deja en cero y el
           editor aparece como una franja vacía hasta que se toca. */
        const vista = est.vistas[est.activo];
        if (vista && vista.refresh) setTimeout(() => vista.refresh(), 0);
      });
    });

    /* Arranca en la pestaña que trae el código de la lección. Sin esto, una
       lección de JavaScript abre sobre un HTML vacío y parece un sandbox roto,
       con el ejemplo escondido en una pestaña que nadie va a pulsar.
       Se simula el clic en vez de repetir la lógica: así el panel, el
       `aria-selected` y el refresco de CodeMirror quedan en un solo sitio. */
    if (opciones.activo && opciones.activo !== est.activo && est.vistas[opciones.activo]) {
      raiz.querySelector(`[data-lang="${opciones.activo}"]`)?.click();
    }

    /* `focusin` burbujea, así que cubre tanto el textarea interno de
       CodeMirror como el de respaldo, sin conocer a ninguno de los dos. */
    if (lenguaje === 'python') {
      $ed.addEventListener('focusin', () => _precalentarPython(est), { once: true });
    }

    // Acciones
    raiz.querySelector('[data-run]').addEventListener('click', () => {
      est.terminado = false;
      if (lenguaje === 'python') _ejecutarPython(est); else _ejecutarWeb(est);
    });

    raiz.querySelector('[data-reset]').addEventListener('click', () => {
      for (const [k, v] of Object.entries(est.vistas)) {
        const texto = inicial[k] || '';
        if (v._ta) { v._ta.value = texto; continue; }
        v.setValue(texto);
      }
      _limpiarConsola(est);
      _cerrarCajon(est);
      _infy(est, '', '');
      if (est.$iframe) { est.$iframe.remove(); est.$iframe = null; }
      est.worker?.terminate();
      est.worker = null;
    });

    raiz.querySelector('[data-ask]').addEventListener('click', () => {
      _pedirDiagnostico(est, {
        mensaje: _t('sandbox.sinError', null, 'El alumno pide ayuda; no hay error de ejecución.'),
        pila: '',
      });
    });

    est.$cajonCerrar.addEventListener('click', () => _cerrarCajon(est));

    est.alMensaje = (ev) => _alMensaje(est, ev);
    window.addEventListener('message', est.alMensaje);
  }

  /** Suelta todo lo que consume recursos. Llamar al quitar el sandbox del DOM. */
  function destroy(raiz) {
    const est = _instancias.get(raiz);
    if (!est) return;
    clearTimeout(est.temporizador);
    window.removeEventListener('message', est.alMensaje);
    est.$iframe?.remove();
    est.worker?.terminate();
    // CM5 no expone destroy(): se retira su nodo, que es lo que libera los
    // listeners que engancha al documento.
    Object.values(est.vistas).forEach((v) => {
      if (v.getWrapperElement) v.getWrapperElement().remove();
    });
    _instancias.delete(raiz);
  }

  /** Monta todos los `[data-sandbox]` que haya en la página. */
  function init() {
    document.querySelectorAll('[data-sandbox]').forEach((el) => {
      let inicial = {};
      try { inicial = JSON.parse(el.dataset.sandboxInicial || '{}'); } catch { /* sin plantilla */ }
      mount(el, { lenguaje: el.dataset.sandbox, inicial, activo: el.dataset.sandboxActiva });
    });
  }

  return { init, mount, destroy };

})();

if (typeof window !== 'undefined') {
  const arrancar = () => {
    if (document.querySelector('[data-sandbox]')) CodeSandbox.init();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar, { once: true });
  } else {
    arrancar();
  }
}

if (typeof module !== 'undefined') module.exports = CodeSandbox;
