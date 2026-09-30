/**
 * IN4MIND — Checkpoint de código dentro de una tarjeta de teoría.
 *
 * Un editor pequeño, un botón de comprobar y nada más. El código del alumno
 * corre en `sandbox-runner.html`, el mismo documento de origen opaco que usa
 * el sandbox grande: nada de `eval` en la página, nada de acceso a la sesión.
 *
 * Es un componente aparte y no un modo de `CodeSandbox` a propósito: aquel ya
 * funciona y tiene bastante estado propio; mezclar aquí su ciclo de vida sería
 * arriesgar algo que ya está en producción por ahorrar cuarenta líneas.
 *
 * Al acertar se desvela lo que venía después en la pestaña de contenido; al
 * fallar, Infy explica por qué —vía Groq si está disponible, y con la pista
 * escrita si no—.
 */

'use strict';

const CodeCheckpoint = (() => {

  const RUNNER = 'sandbox-runner.html';
  const LIMITE_MS = 5000;
  /* Pyodide son ~10 MB la primera vez; hasta que el worker avisa de que está
     listo, el reloj mide una descarga y no un bucle infinito. */
  const ARRANQUE_PY_MS = 120000;
  const _estados = new Map();   // nodo raíz -> estado

  function _t(clave, params, respaldo) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(clave, params);
      if (out && out !== clave) return out;
    }
    return respaldo;
  }

  function _infy(estado, gesto, texto) {
    const img = estado.$infyImg;
    const txt = estado.$infyTexto;
    if (txt) txt.textContent = texto || '';
    if (img && typeof InfyMascot !== 'undefined' && InfyMascot.GESTOS?.[gesto]) {
      img.src = `${InfyMascot.RUTA}${InfyMascot.GESTOS[gesto]}`;
      img.hidden = false;
    }
    estado.$aviso?.classList.toggle('is-visible', Boolean(texto));
  }

  /** Iframe nuevo por intento: reutilizarlo arrastra el estado del anterior. */
  function _nuevoIframe(estado) {
    estado.$iframe?.remove();
    const marco = document.createElement('iframe');
    // Sin `allow-same-origin`: origen opaco, sin acceso a cookies ni storage.
    marco.setAttribute('sandbox', 'allow-scripts');
    marco.setAttribute('title', 'checkpoint');
    marco.hidden = true;
    marco.src = RUNNER;
    estado.raiz.appendChild(marco);
    estado.$iframe = marco;
    return marco;
  }

  function _limpiar(estado) {
    clearTimeout(estado.temporizador);
    if (estado.alMensaje) window.removeEventListener('message', estado.alMensaje);
    estado.alMensaje = null;
    estado.$iframe?.remove();
    estado.$iframe = null;
  }

  /**
   * Ejecuta el código y resuelve con las líneas que imprimió.
   *
   * El disparo va por dos caminos —el saludo del ejecutor y el `load` del
   * iframe— porque ninguno de los dos llega siempre primero; `enviado` evita
   * que se ejecute dos veces.
   */
  /**
   * Reparte el código del alumno y la comprobación en las ranuras del
   * ejecutor.
   *
   * En HTML y CSS el alumno no escribe la línea que imprime el resultado: eso
   * lo pone `comprobacion`, un JS oculto que mira el DOM o el estilo ya
   * aplicado. Si tuviera que escribir el `console.log`, el ejercicio dejaría
   * de ser sobre HTML o CSS.
   */
  function _ranuras(def, codigo) {
    if (def.lenguaje === 'html') return { html: codigo, css: def.css || '', js: def.comprobacion || '' };
    if (def.lenguaje === 'css') return { html: def.html || '', css: codigo, js: def.comprobacion || '' };
    return { js: codigo };
  }

  /** Ejecuta Python en un worker propio, creado sólo al pulsar Comprobar. */
  function _ejecutarPython(estado, codigo) {
    return new Promise((resolve) => {
      const salida = [];
      let cerrado = false;

      const terminar = (motivo) => {
        if (cerrado) return;
        cerrado = true;
        clearTimeout(estado.temporizador);
        resolve({ salida, motivo });
      };

      if (!estado.worker) {
        estado.worker = new Worker('src/js/workers/python-worker.js');
        estado.worker.addEventListener('error', () => terminar('worker'));
      }

      estado.worker.onmessage = (ev) => {
        const d = ev.data || {};
        if (d.tipo === 'listo') {
          /* Pyodide ya está en memoria: a partir de aquí el reloj mide el
             código del alumno y no la descarga, que la primera vez puede
             pasar del minuto. */
          clearTimeout(estado.temporizador);
          estado.temporizador = setTimeout(() => terminar('timeout'), LIMITE_MS);
          return;
        }
        if (d.tipo === 'salida') { salida.push(String(d.texto ?? '')); return; }
        if (d.tipo === 'error') { terminar(d.mensaje || 'error'); return; }
        if (d.tipo === 'fin') terminar(null);
      };

      estado.temporizador = setTimeout(() => terminar('timeout'), ARRANQUE_PY_MS);
      estado.worker.postMessage({ tipo: 'ejecutar', codigo });
    });
  }

  function _ejecutar(estado, codigo) {
    return new Promise((resolve) => {
      const marco = _nuevoIframe(estado);
      const salida = [];
      let enviado = false;
      let cerrado = false;

      const terminar = (motivo) => {
        if (cerrado) return;
        cerrado = true;
        clearTimeout(estado.temporizador);
        window.removeEventListener('message', estado.alMensaje);
        estado.alMensaje = null;
        resolve({ salida, motivo });
      };

      const mandar = () => {
        if (enviado || !marco.contentWindow) return;
        enviado = true;
        marco.contentWindow.postMessage(
          { in4mind: true, tipo: 'ejecutar', codigo: _ranuras(estado.def, codigo) }, '*');
      };

      estado.alMensaje = (ev) => {
        if (!marco.contentWindow || ev.source !== marco.contentWindow) return;
        const d = ev.data;
        if (!d || d.in4mind !== true) return;
        if (d.tipo === 'listo') { mandar(); return; }
        if (d.tipo === 'consola') { salida.push(String(d.texto ?? '')); return; }
        if (d.tipo === 'error') { terminar(d.mensaje || 'error'); return; }
        if (d.tipo === 'fin') { terminar(null); }
      };

      window.addEventListener('message', estado.alMensaje);
      marco.addEventListener('load', mandar, { once: true });
      estado.temporizador = setTimeout(() => terminar('timeout'), LIMITE_MS);
    });
  }

  /** Pide a Infy que explique el fallo sin resolverlo. */
  async function _pista(estado, codigo, motivo, obtenido) {
    const def = estado.def;
    _infy(estado, 'THINKING', _t('tutorial.checkpointPensando', null, 'Déjame ver qué pasó…'));

    if (typeof GroqService === 'undefined' || !GroqService.chat) {
      _infy(estado, 'THINKING', def.pista);
      return;
    }

    const prompt = [
      'Eres Infy, tutor de IN4MIND. Un estudiante intenta este ejercicio de una línea.',
      'Dile en español, en menos de 45 palabras y con tono amable, qué está fallando',
      'y hacia dónde mirar. NO escribas el código corregido ni la solución literal.',
      '',
      `Ejercicio: ${def.enunciado}`,
      `Su código:\n${codigo}`,
      motivo ? `Error: ${motivo}` : `Imprimió: ${obtenido || '(nada)'}`,
      `Se esperaba: ${def.esperado}`,
    ].join('\n');

    try {
      const respuesta = await GroqService.chat([{ role: 'user', content: prompt }]);
      _infy(estado, 'THINKING', respuesta || def.pista);
    } catch {
      // Sin IA, la pista escrita cumple la misma función.
      _infy(estado, 'THINKING', def.pista);
    }
  }

  function _desbloquear(estado) {
    if (estado.abierto) return;
    estado.abierto = true;
    estado.raiz.classList.add('is-resuelto');
    for (const el of estado.bloqueados) {
      el.hidden = false;
      el.classList.add('is-revelado');
    }
    estado.$boton.disabled = true;
    estado.$boton.textContent = _t('tutorial.checkpointResuelto', null, '¡Resuelto!');
  }

  async function _comprobar(estado) {
    if (estado.corriendo) return;
    estado.corriendo = true;
    estado.$boton.disabled = true;

    const codigo = estado.$editor.value;
    const def = estado.def;
    _infy(estado, 'LEARNING', _t('tutorial.checkpointProbando', null, 'Probando tu código…'));

    let acierto = false;
    let obtenido = '';
    let motivo = null;

    if (def.lenguaje === 'texto') {
      /* SQL, git y fórmulas no tienen motor en el navegador. Se comprueba la
         sintaxis contra un patrón, que es una revisión honesta de lo escrito
         —no una ejecución—, y así se dice en el propio aviso. */
      obtenido = codigo.trim();
      try { acierto = new RegExp(def.patron, 'i').test(obtenido); }
      catch { motivo = 'patron'; }
    } else if (def.lenguaje === 'python') {
      const r = await _ejecutarPython(estado, codigo);
      motivo = r.motivo;
      obtenido = r.salida.map(s => s.trim()).filter(Boolean).pop() || '';
      acierto = !motivo && obtenido === String(def.esperado).trim();
    } else {
      const r = await _ejecutar(estado, codigo);
      motivo = r.motivo;
      obtenido = r.salida.map(s => s.trim()).filter(Boolean).pop() || '';
      acierto = !motivo && obtenido === String(def.esperado).trim();
    }

    _limpiar(estado);

    estado.corriendo = false;
    estado.$boton.disabled = false;

    if (acierto) {
      _infy(estado, 'SUCCESS', _t('tutorial.checkpointBien', null, '¡Eso es! Sigue leyendo.'));
      _desbloquear(estado);
      return;
    }
    void _pista(estado, codigo, motivo, obtenido);
  }

  /**
   * Monta un checkpoint.
   *
   * @param {HTMLElement} raiz      contenedor vacío
   * @param {object}      def       definición (ver LessonCheckpoints)
   * @param {HTMLElement[]} bloqueados  bloques que se desvelan al acertar
   */
  function mount(raiz, def, bloqueados = []) {
    if (!raiz || !def || _estados.has(raiz)) return null;

    raiz.classList.add('lw-check');
    raiz.innerHTML = `
      <div class="lw-check__head">
        <span class="lw-check__eyebrow">${_t('tutorial.checkpointTitulo', null, 'Compruébalo tú')}</span>
        <p class="lw-check__enunciado"></p>
      </div>
      <label class="lw-check__label" for="lw-check-ed">${def.etiqueta || _t('tutorial.checkpointEditor', null, 'Tu código')}</label>
      <textarea class="lw-check__editor" id="lw-check-ed" spellcheck="false" rows="6"></textarea>
      <div class="lw-check__pie">
        <button type="button" class="btn--primary lw-check__btn"></button>
        <div class="lw-check__aviso" role="status" aria-live="polite">
          <img class="lw-check__infy" alt="" aria-hidden="true" width="34" height="34" hidden>
          <span class="lw-check__texto"></span>
        </div>
      </div>`;

    const estado = {
      raiz, def, bloqueados,
      $editor: raiz.querySelector('.lw-check__editor'),
      $boton: raiz.querySelector('.lw-check__btn'),
      $aviso: raiz.querySelector('.lw-check__aviso'),
      $infyImg: raiz.querySelector('.lw-check__infy'),
      $infyTexto: raiz.querySelector('.lw-check__texto'),
      $iframe: null,
      worker: null,
      alMensaje: null,
      temporizador: 0,
      corriendo: false,
      abierto: false,
    };

    raiz.querySelector('.lw-check__enunciado').textContent = def.enunciado;
    estado.$editor.value = def.inicial;
    estado.$boton.textContent = _t('tutorial.checkpointComprobar', null, 'Comprobar');
    estado.$boton.addEventListener('click', () => void _comprobar(estado));

    // Lo que viene después se esconde hasta resolverlo.
    for (const el of bloqueados) el.hidden = true;

    _estados.set(raiz, estado);
    return estado;
  }

  /** Suelta iframe, listener y temporizador. Llamar al quitar el checkpoint. */
  function destroy(raiz) {
    const estado = _estados.get(raiz);
    if (!estado) return;
    _limpiar(estado);
    /* El worker de Python sobrevive al DOM con todo Pyodide dentro: se
       conserva entre intentos, pero al soltar el checkpoint hay que matarlo. */
    estado.worker?.terminate();
    estado.worker = null;
    _estados.delete(raiz);
  }

  return { mount, destroy };

})();

if (typeof module !== 'undefined') module.exports = CodeCheckpoint;
