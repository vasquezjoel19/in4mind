/**
 * IN4MIND — Mapa de dominio en 3D.
 *
 * Constelación de conceptos: cada curso es un centro y cada tema evaluado
 * orbita a su alrededor, unido por una línea. El color dice en qué estado
 * está: verde dominado, ámbar en progreso, rojo con un hueco detectado.
 * Tocar un nodo rojo abre la micro-lección de refuerzo de ese tema.
 *
 * Tres cosas gobiernan este archivo:
 *
 * 1. **WebGL es un lujo, no un requisito.** Antes de descargar Three.js —194 KB
 *    comprimidos— se comprueba si merece la pena en este aparato. Si no, se
 *    dibuja la misma constelación en 2D con CSS, con los mismos colores y los
 *    mismos clics. Nadie se queda sin mapa.
 *
 * 2. **Nada de excepciones sueltas.** Cualquier fallo al importar el módulo,
 *    al crear el contexto o al dibujar cae al modo 2D. Un mapa de progreso no
 *    puede tumbar la página de perfil.
 *
 * 3. **No se dibuja lo que no se ve.** Un `IntersectionObserver` detiene el
 *    bucle de render en cuanto el gráfico sale del viewport y lo reanuda al
 *    volver; lo mismo con la pestaña en segundo plano.
 */

'use strict';

const SkillGraph3D = (() => {

  /* Los colores del encargo. Van aquí y no en CSS porque Three.js necesita el
     valor, no una variable: si cambian, cambian en los dos modos a la vez. */
  const COLORES = {
    mastered: '#10B981',
    progress: '#F59E0B',
    gap: '#EF4444',
    curso: '#4A76B2',
    enlace: '#93B4D9',
  };

  const CONFIG = {
    radioCurso: 26,
    radioTema: 11,
    giro: 0.0016,
    tamNodo: 1.9,
    tamCurso: 2.9,
  };

  let _estado = null;   // { modo, host, renderer, raf, observador, ... }
  let _firma = '';      // huella de la última constelación dibujada

  function _t(key, params, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key, params);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  /* ── Datos ─────────────────────────────────────────────────────────────── */

  /** Hash estable: el mapa debe verse igual en cada visita. */
  function _hash(texto) {
    let h = 0;
    for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /**
   * Convierte el estado del motor en nodos y enlaces.
   * Cada curso es un centro; sus temas orbitan alrededor.
   */
  function _datos() {
    /* `getTopics()` ordena por actividad reciente, que cambia en cuanto se
       guarda cualquier cosa. Aquí se reordena por identificador: si no, el
       mapa se recolocaría entero cada vez que alguien responde algo. */
    const temas = (typeof AdaptiveLearningService !== 'undefined'
      ? AdaptiveLearningService.getTopics()
      : []).slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    const cursos = new Map();
    for (const tema of temas) {
      const curso = tema.courseId || 'general';
      if (!cursos.has(curso)) cursos.set(curso, []);
      cursos.get(curso).push(tema);
    }

    const nodos = [];
    const enlaces = [];
    const totalCursos = Math.max(cursos.size, 1);
    let ci = 0;

    for (const [curso, lista] of cursos) {
      const ang = (ci / totalCursos) * Math.PI * 2;
      const alto = ((_hash(curso) % 100) / 100 - 0.5) * 16;
      const centro = {
        id: `curso:${curso}`,
        label: curso,
        tipo: 'curso',
        estado: 'curso',
        x: Math.cos(ang) * CONFIG.radioCurso,
        y: alto,
        z: Math.sin(ang) * CONFIG.radioCurso,
      };
      nodos.push(centro);

      lista.forEach((tema, ti) => {
        const a = (ti / Math.max(lista.length, 1)) * Math.PI * 2 + _hash(tema.id) % 10 / 10;
        const r = CONFIG.radioTema;
        const nodo = {
          id: tema.id,
          label: tema.label || tema.id,
          tipo: 'tema',
          estado: tema.status,
          topic: tema,
          x: centro.x + Math.cos(a) * r,
          y: centro.y + ((_hash(tema.id) % 100) / 100 - 0.5) * 12,
          z: centro.z + Math.sin(a) * r,
        };
        nodos.push(nodo);
        enlaces.push([centro, nodo]);
      });

      ci += 1;
    }

    return { nodos, enlaces };
  }

  /**
   * Huella de la constelación: qué nodos hay y en qué estado.
   *
   * El motor emite `in4mind-adaptive-updated` en cada escritura, también
   * cuando solo guarda la micro-lección recién generada. Sin esta comparación,
   * abrir un refuerzo reconstruía el mapa entero y borraba la nota que se
   * estaba leyendo.
   */
  function _firmaDe(datos) {
    return datos.nodos.map(n => `${n.id}:${n.estado}`).join('|');
  }

  function _color(nodo) {
    if (nodo.tipo === 'curso') return COLORES.curso;
    return COLORES[nodo.estado] || COLORES.progress;
  }

  /* ── Capacidades ───────────────────────────────────────────────────────── */

  /**
   * ¿Se puede (y conviene) dibujar en 3D aquí?
   *
   * Mismo criterio que el fondo neuronal de la portada: pantallas pequeñas,
   * ahorro de datos, equipos modestos y ausencia de WebGL van al modo 2D, que
   * enseña exactamente la misma información.
   */
  function puede3D() {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      if (window.matchMedia('(max-width: 768px)').matches) return false;

      const con = navigator.connection;
      if (con?.saveData) return false;
      if (con?.effectiveType && /2g/.test(con.effectiveType)) return false;

      if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4) return false;
      if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency < 4) return false;

      const prueba = document.createElement('canvas');
      const ctx = prueba.getContext('webgl2') || prueba.getContext('webgl');
      if (!ctx) return false;
      ctx.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    } catch {
      return false;   // cualquier duda, al modo barato
    }
  }

  /* ── Selección ─────────────────────────────────────────────────────────── */

  function _panel(host) {
    let p = host.querySelector('.skillgraph__panel');
    if (!p) {
      p = document.createElement('div');
      p.className = 'skillgraph__panel';
      host.appendChild(p);
    }
    return p;
  }

  /**
   * Al elegir un nodo: si tiene hueco, se abre su refuerzo; si no, se resume
   * su estado. Los centros de curso no abren nada.
   */
  function _seleccionar(host, nodo) {
    const panel = _panel(host);
    panel.textContent = '';
    if (!nodo || nodo.tipo === 'curso') return;

    const titulo = document.createElement('p');
    titulo.className = 'skillgraph__panel-title';
    titulo.textContent = nodo.label;
    panel.appendChild(titulo);

    if (nodo.estado === 'gap' && typeof ReinforcementNote !== 'undefined') {
      ReinforcementNote.showForTopic(nodo.id, panel);
      return;
    }

    const resumen = document.createElement('p');
    resumen.className = 'skillgraph__panel-text';
    const t = nodo.topic || {};
    resumen.textContent = nodo.estado === 'mastered'
      ? _t('adaptive.graphMastered', { n: t.correct || 0, total: t.seen || 0 },
        `Dominado: ${t.correct || 0} de ${t.seen || 0} aciertos.`)
      : _t('adaptive.graphProgress', { n: t.correct || 0, total: t.seen || 0 },
        `En progreso: ${t.correct || 0} de ${t.seen || 0} aciertos.`);
    panel.appendChild(resumen);
  }

  /* ── Modo 2D ───────────────────────────────────────────────────────────── */

  /**
   * Misma constelación proyectada en plano, con posiciones en porcentaje.
   * Sin canvas, sin bucle de animación y sin descargar nada: es el modo que
   * tiene que funcionar en cualquier teléfono.
   */
  function _render2D(host, datos) {
    const lienzo = document.createElement('div');
    lienzo.className = 'skillgraph__flat';
    lienzo.setAttribute('role', 'group');
    lienzo.setAttribute('aria-label', _t('adaptive.graphAria', null, 'Mapa de dominio'));

    const xs = datos.nodos.map(n => n.x);
    const zs = datos.nodos.map(n => n.z);
    const minX = Math.min(...xs, -1), maxX = Math.max(...xs, 1);
    const minZ = Math.min(...zs, -1), maxZ = Math.max(...zs, 1);
    const pct = (v, min, max) => 8 + ((v - min) / (max - min || 1)) * 84;

    for (const nodo of datos.nodos) {
      const punto = document.createElement('button');
      punto.type = 'button';
      punto.className = `skillgraph__dot skillgraph__dot--${nodo.tipo === 'curso' ? 'curso' : nodo.estado}`;
      punto.style.left = `${pct(nodo.x, minX, maxX)}%`;
      punto.style.top = `${pct(nodo.z, minZ, maxZ)}%`;
      punto.style.setProperty('--dot', _color(nodo));
      punto.title = nodo.label;
      // El nombre accesible lleva el estado: el color por sí solo no lo dice.
      punto.setAttribute('aria-label', `${nodo.label} — ${_estadoTexto(nodo)}`);
      punto.addEventListener('click', () => _seleccionar(host, nodo));
      lienzo.appendChild(punto);
    }

    host.appendChild(lienzo);
    return { modo: '2d', host };
  }

  function _estadoTexto(nodo) {
    if (nodo.tipo === 'curso') return _t('adaptive.graphCourse', null, 'Curso');
    if (nodo.estado === 'mastered') return _t('adaptive.graphStateMastered', null, 'dominado');
    if (nodo.estado === 'gap') return _t('adaptive.graphStateGap', null, 'necesita refuerzo');
    return _t('adaptive.graphStateProgress', null, 'en progreso');
  }

  /* ── Modo 3D ───────────────────────────────────────────────────────────── */

  async function _render3D(host, datos) {
    const THREE = await import('../vendor/three.module.js');

    const lienzo = document.createElement('div');
    lienzo.className = 'skillgraph__canvas';
    host.appendChild(lienzo);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
    camera.position.set(0, 14, 78);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    lienzo.appendChild(renderer.domElement);

    /* Una geometría compartida para todas las esferas: son decenas de nodos,
       no miles, pero duplicarla no aporta nada y sí ocupa memoria. */
    const geoNodo = new THREE.SphereGeometry(1, 16, 12);
    const materiales = new Map();
    const materialDe = (color) => {
      if (!materiales.has(color)) {
        materiales.set(color, new THREE.MeshBasicMaterial({ color: new THREE.Color(color) }));
      }
      return materiales.get(color);
    };

    const grupo = new THREE.Group();
    const mallas = [];

    for (const nodo of datos.nodos) {
      const malla = new THREE.Mesh(geoNodo, materialDe(_color(nodo)));
      malla.position.set(nodo.x, nodo.y, nodo.z);
      const escala = nodo.tipo === 'curso' ? CONFIG.tamCurso : CONFIG.tamNodo;
      malla.scale.setScalar(escala);
      malla.userData.nodo = nodo;
      grupo.add(malla);
      mallas.push(malla);
    }

    if (datos.enlaces.length) {
      const pos = new Float32Array(datos.enlaces.length * 6);
      datos.enlaces.forEach(([a, b], i) => {
        pos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      grupo.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
        color: new THREE.Color(COLORES.enlace),
        transparent: true,
        opacity: 0.35,
      })));
    }

    scene.add(grupo);

    const medir = () => {
      const ancho = lienzo.clientWidth || 1;
      const alto = lienzo.clientHeight || 1;
      renderer.setSize(ancho, alto, false);
      camera.aspect = ancho / alto;
      camera.updateProjectionMatrix();
    };
    medir();

    const estado = { modo: '3d', host, renderer, scene, camera, grupo, mallas, geoNodo, materiales, raf: 0, visible: false };

    const dibujar = () => {
      estado.raf = requestAnimationFrame(dibujar);
      grupo.rotation.y += CONFIG.giro;
      renderer.render(scene, camera);
    };

    const arrancar = () => {
      if (estado.raf || document.hidden) return;
      estado.raf = requestAnimationFrame(dibujar);
    };
    const parar = () => {
      if (!estado.raf) return;
      cancelAnimationFrame(estado.raf);
      estado.raf = 0;
    };

    /* Fuera del viewport no se dibuja: la GPU es del usuario, no nuestra. */
    estado.observador = new IntersectionObserver(([entrada]) => {
      estado.visible = entrada.isIntersecting;
      if (entrada.isIntersecting) arrancar();
      else parar();
    }, { threshold: 0.05 });
    estado.observador.observe(lienzo);

    estado.onVisibilidad = () => { if (document.hidden) parar(); else if (estado.visible) arrancar(); };
    document.addEventListener('visibilitychange', estado.onVisibilidad);

    estado.medidor = new ResizeObserver(medir);
    estado.medidor.observe(lienzo);

    // Clic: rayo desde el puntero hasta la primera esfera que encuentre.
    const rayo = new THREE.Raycaster();
    const punto = new THREE.Vector2();
    estado.onClick = (ev) => {
      const caja = renderer.domElement.getBoundingClientRect();
      punto.x = ((ev.clientX - caja.left) / caja.width) * 2 - 1;
      punto.y = -((ev.clientY - caja.top) / caja.height) * 2 + 1;
      rayo.setFromCamera(punto, camera);
      const tocados = rayo.intersectObjects(mallas, false);
      if (tocados.length) _seleccionar(host, tocados[0].object.userData.nodo);
    };
    renderer.domElement.addEventListener('click', estado.onClick);

    return estado;
  }

  /* ── Ciclo de vida ─────────────────────────────────────────────────────── */

  function _vacio(host) {
    const p = document.createElement('p');
    p.className = 'skillgraph__empty';
    p.textContent = _t('adaptive.graphEmpty', null,
      'Aún no hay datos: completa alguna comprobación para ver tu mapa.');
    host.appendChild(p);
  }

  /**
   * Monta el mapa dentro de `host`.
   * @param {Element} host
   * @returns {Promise<string>} modo usado: '3d', '2d' o 'vacio'
   */
  async function mount(host) {
    if (!host) return 'vacio';
    destroy();
    host.textContent = '';

    const datos = _datos();
    _firma = _firmaDe(datos);
    if (!datos.nodos.length) {
      _vacio(host);
      return 'vacio';
    }

    if (puede3D()) {
      try {
        _estado = await _render3D(host, datos);
        return '3d';
      } catch (err) {
        /* Importación fallida, sin contexto WebGL, driver quisquilloso… da
           igual la causa: se limpia lo a medias y se cae al 2D. */
        if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('skillgraph_webgl', { message: err?.message || String(err) });
        }
        host.textContent = '';
      }
    }

    _estado = _render2D(host, datos);
    return '2d';
  }

  /** Libera GPU y oyentes. Seguro de llamar aunque no haya nada montado. */
  function destroy() {
    if (!_estado) return;
    const e = _estado;
    _estado = null;
    try {
      if (e.raf) cancelAnimationFrame(e.raf);
      e.observador?.disconnect();
      e.medidor?.disconnect();
      if (e.onVisibilidad) document.removeEventListener('visibilitychange', e.onVisibilidad);
      if (e.onClick) e.renderer?.domElement?.removeEventListener('click', e.onClick);
      e.geoNodo?.dispose();
      e.materiales?.forEach(m => m.dispose());
      e.grupo?.traverse?.(obj => {
        if (obj.geometry && obj.geometry !== e.geoNodo) obj.geometry.dispose();
        if (obj.material && !e.materiales?.has?.(obj.material.color?.getHexString?.())) obj.material.dispose?.();
      });
      e.renderer?.dispose();
    } catch { /* al desmontar, cualquier fallo ya da igual */ }
  }

  /**
   * Reconstruye solo si la constelación ha cambiado de verdad: nodos nuevos o
   * un estado distinto. Guardar una lección no cambia el mapa, así que no
   * debe tirar lo que el usuario tiene abierto.
   */
  function refresh() {
    const host = document.querySelector('[data-skill-graph]');
    if (!host) return;
    if (_firmaDe(_datos()) === _firma) return;
    void mount(host);
  }

  function init() {
    const host = document.querySelector('[data-skill-graph]');
    if (!host) return;

    // Sin el motor activo no hay mapa que enseñar: la sección se oculta entera
    // en vez de dejar un hueco vacío en el perfil.
    const activo = typeof AdaptiveLearningService !== 'undefined' && AdaptiveLearningService.isEnabled();
    const seccion = host.closest('[data-skill-graph-section]') || host;
    seccion.hidden = !activo;
    if (!activo) return;

    void mount(host);
    window.addEventListener('in4mind-adaptive-updated', refresh);
  }

  return { init, mount, destroy, refresh, puede3D, COLORES, _datos };

})();

if (typeof window !== 'undefined') {
  const boot = () => SkillGraph3D.init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

if (typeof module !== 'undefined') module.exports = SkillGraph3D;
