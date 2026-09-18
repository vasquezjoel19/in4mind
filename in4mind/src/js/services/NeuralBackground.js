/**
 * IN4MIND — Fondo de red neuronal (Three.js).
 *
 * Nube de puntos en 3D real, con líneas entre los vecinos cercanos, giro lento
 * y una ligera reacción al ratón. Va detrás del contenido del hero y nunca
 * captura el puntero.
 *
 * Three.js pesa 194 KB comprimidos, casi tres veces lo que ocupa todo el
 * arranque de la aplicación. Por eso aquí nada se descarga hasta que se cumplen
 * todas las condiciones de `_deberiaDibujar()`: es decoración, y la decoración
 * no debe costarle la batería ni los datos a nadie que no vaya a verla.
 *
 * Se carga como script clásico y usa `import()` dinámico, así que el módulo de
 * Three.js solo entra en juego en el momento en que hace falta.
 */

'use strict';

const NeuralBackground = (() => {

  const SELECTOR_HOST = '[data-neural-bg]';

  /* Ajustado a ojo sobre el hero: suficientes nodos para que se lea como una
     red, pocos para que el coste por fotograma sea despreciable. */
  const CONFIG = {
    nodos: 90,
    nodosMovil: 42,
    radio: 46,
    distanciaEnlace: 17,
    enlacesMax: 260,
    velocidadGiro: 0.00022,
    fuerzaRaton: 0.12,
  };

  let _estado = null;   // { renderer, scene, camera, raf, ... }
  let _cargando = null;

  /* ── Condiciones ───────────────────────────────────────────────────────── */

  function _prefiereMenosMovimiento() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  /**
   * ¿Merece la pena dibujar esto en este dispositivo?
   *
   * Se descarta pronto y sin ruido. Un fondo decorativo no justifica gastar
   * datos de una tarifa limitada ni vaciar la batería de un móvil modesto.
   */
  function _deberiaDibujar(host) {
    if (!host) return false;
    if (_prefiereMenosMovimiento()) return false;

    // Ahorro de datos activado por la persona: se respeta sin discusión.
    const con = navigator.connection;
    if (con?.saveData) return false;
    if (con?.effectiveType && /2g/.test(con.effectiveType)) return false;

    // Equipos de gama baja: `deviceMemory` solo lo exponen los Chromium, y
    // cuando está, 4 GB es un corte razonable para efectos accesorios.
    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4) return false;
    if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency < 4) return false;

    // Sin WebGL no hay nada que hacer; el hero se ve igual sin esta capa.
    try {
      const prueba = document.createElement('canvas');
      const ctx = prueba.getContext('webgl2') || prueba.getContext('webgl');
      if (!ctx) return false;
      ctx.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      return false;
    }

    return true;
  }

  /* ── Colores ───────────────────────────────────────────────────────────── */

  /**
   * Toma los colores de los tokens CSS para que el fondo siga al tema en vez
   * de llevar valores propios que se desincronizarían al retocar la paleta.
   */
  function _paleta() {
    const cs = getComputedStyle(document.documentElement);
    const leer = (nombre, respaldo) => (cs.getPropertyValue(nombre).trim() || respaldo);
    return {
      nodo: leer('--clr-brand-400', '#7da6dd'),
      enlace: leer('--clr-brand-600', '#3d6499'),
      brillo: leer('--clr-accent', '#8ab4f8'),
    };
  }

  /* ── Construcción de la escena ─────────────────────────────────────────── */

  function _crearNodos(THREE, cantidad) {
    const posiciones = new Float32Array(cantidad * 3);
    const derivas = new Float32Array(cantidad * 3);

    for (let i = 0; i < cantidad; i++) {
      /* Distribución sobre una esfera, no en un cubo: evita que se noten las
         esquinas al girar y concentra los nodos donde se miran. */
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const r = CONFIG.radio * Math.cbrt(Math.random());
      const s = Math.sqrt(1 - u * u);

      posiciones[i * 3]     = r * s * Math.cos(theta);
      posiciones[i * 3 + 1] = r * s * Math.sin(theta) * 0.62;  // achatado: cabe mejor en un hero apaisado
      posiciones[i * 3 + 2] = r * u;

      derivas[i * 3]     = (Math.random() - 0.5) * 0.012;
      derivas[i * 3 + 1] = (Math.random() - 0.5) * 0.012;
      derivas[i * 3 + 2] = (Math.random() - 0.5) * 0.012;
    }
    return { posiciones, derivas };
  }

  /** Textura de punto con bordes suaves: un cuadrado nítido delata el truco. */
  function _texturaPunto(THREE, color) {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, color);
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    g.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  async function _construir(host, THREE) {
    const paleta = _paleta();
    const esMovil = window.matchMedia('(max-width: 768px)').matches;
    const cantidad = esMovil ? CONFIG.nodosMovil : CONFIG.nodos;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
    camera.position.z = 108;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,            // el hero ya tiene su propio degradado detrás
      antialias: !esMovil,    // en móvil no compensa el coste
      powerPreference: 'low-power',
    });
    renderer.setClearAlpha(0);
    /* El ratio se limita a 2: por encima no se aprecia y el coste por píxel
       crece al cuadrado, que es lo que castiga a los móviles con pantallas
       muy densas. */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const { posiciones, derivas } = _crearNodos(THREE, cantidad);

    const geoNodos = new THREE.BufferGeometry();
    geoNodos.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));

    const matNodos = new THREE.PointsMaterial({
      size: esMovil ? 2.6 : 2.1,
      map: _texturaPunto(THREE, paleta.brillo),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,                 // sin esto los puntos se recortan entre sí
      blending: THREE.AdditiveBlending,  // da la sensación de luz, no de plástico
      sizeAttenuation: true,
    });
    const puntos = new THREE.Points(geoNodos, matNodos);
    scene.add(puntos);

    // Las líneas se recalculan en cada fotograma, así que el buffer va aparte
    // y con tamaño fijo: reservar una vez evita generar basura constantemente.
    const posEnlaces = new Float32Array(CONFIG.enlacesMax * 6);
    const geoEnlaces = new THREE.BufferGeometry();
    geoEnlaces.setAttribute('position', new THREE.BufferAttribute(posEnlaces, 3));
    const matEnlaces = new THREE.LineBasicMaterial({
      color: new THREE.Color(paleta.enlace),
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const enlaces = new THREE.LineSegments(geoEnlaces, matEnlaces);
    scene.add(enlaces);

    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    return {
      THREE, renderer, scene, camera, puntos, enlaces,
      posiciones, derivas, posEnlaces, cantidad,
      raton: { x: 0, y: 0, objetivoX: 0, objetivoY: 0 },
      raf: 0, visible: true, host,
    };
  }

  /* ── Bucle ─────────────────────────────────────────────────────────────── */

  function _recalcularEnlaces(e) {
    const { posiciones, posEnlaces, cantidad } = e;
    const dMax = CONFIG.distanciaEnlace;
    const dMax2 = dMax * dMax;
    let n = 0;

    for (let i = 0; i < cantidad && n < CONFIG.enlacesMax; i++) {
      const ix = posiciones[i * 3], iy = posiciones[i * 3 + 1], iz = posiciones[i * 3 + 2];
      for (let j = i + 1; j < cantidad && n < CONFIG.enlacesMax; j++) {
        const dx = ix - posiciones[j * 3];
        const dy = iy - posiciones[j * 3 + 1];
        const dz = iz - posiciones[j * 3 + 2];
        // Se compara el cuadrado para ahorrarse una raíz por pareja.
        if (dx * dx + dy * dy + dz * dz > dMax2) continue;

        posEnlaces[n * 6]     = ix;
        posEnlaces[n * 6 + 1] = iy;
        posEnlaces[n * 6 + 2] = iz;
        posEnlaces[n * 6 + 3] = posiciones[j * 3];
        posEnlaces[n * 6 + 4] = posiciones[j * 3 + 1];
        posEnlaces[n * 6 + 5] = posiciones[j * 3 + 2];
        n++;
      }
    }

    // El resto del buffer se deja en cero: los segmentos degenerados no pintan.
    posEnlaces.fill(0, n * 6);
    e.enlaces.geometry.attributes.position.needsUpdate = true;
    e.enlaces.geometry.setDrawRange(0, n * 2);
  }

  function _paso(e, dt) {
    const { posiciones, derivas, cantidad } = e;
    const limite = CONFIG.radio;

    for (let i = 0; i < cantidad; i++) {
      for (let k = 0; k < 3; k++) {
        const idx = i * 3 + k;
        posiciones[idx] += derivas[idx] * dt;
        // Rebote suave al llegar al borde: mantiene la nube compacta sin
        // teletransportar nodos, que se vería como un parpadeo.
        if (Math.abs(posiciones[idx]) > limite) derivas[idx] *= -1;
      }
    }
    e.puntos.geometry.attributes.position.needsUpdate = true;

    e.puntos.rotation.y += CONFIG.velocidadGiro * dt;
    e.enlaces.rotation.y = e.puntos.rotation.y;

    // El ratón se persigue con suavizado; un seguimiento directo resulta brusco.
    const r = e.raton;
    r.x += (r.objetivoX - r.x) * 0.05;
    r.y += (r.objetivoY - r.y) * 0.05;
    e.camera.position.x = r.x * 18;
    e.camera.position.y = r.y * 10;
    e.camera.lookAt(0, 0, 0);
  }

  function _bucle(e) {
    let anterior = performance.now();
    let acumulado = 0;

    const tick = (ahora) => {
      e.raf = requestAnimationFrame(tick);

      // dt acotado: al volver de una pestaña en segundo plano el salto sería
      // enorme y la nube daría un tirón.
      const dt = Math.min((ahora - anterior) / 16.67, 3);
      anterior = ahora;

      _paso(e, dt);

      /* Los enlaces se recalculan a ~20 Hz, no en cada fotograma: es el trozo
         caro (O(n²)) y a simple vista no se distingue. */
      acumulado += dt;
      if (acumulado > 3) {
        acumulado = 0;
        _recalcularEnlaces(e);
      }

      e.renderer.render(e.scene, e.camera);
    };

    e.raf = requestAnimationFrame(tick);
  }

  /* El estado se refleja en el DOM (`data-anim`). Sirve para comprobar desde
     fuera que la pausa ocurre de verdad —el bucle es invisible por definición—
     y para diagnosticar en producción sin instrumentar nada. */
  function _marcar(e, estado) {
    try { e.host.dataset.anim = estado; } catch { /* nodo ya retirado */ }
  }

  function _pausar(e) {
    if (!e) return;
    if (e.raf) {
      cancelAnimationFrame(e.raf);
      e.raf = 0;
    }
    _marcar(e, 'paused');
  }

  function _reanudar(e) {
    if (!e || e.raf) return;
    _bucle(e);
    _marcar(e, 'running');
  }

  /* ── Tamaño ────────────────────────────────────────────────────────────── */

  function _ajustar(e) {
    const rect = e.host.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));

    /* La densidad se relee en cada ajuste, no solo al construir: cambia al
       mover la ventana a otro monitor o al hacer zoom, y si no se actualiza el
       lienzo se queda con la densidad antigua y se ve borroso. */
    const densidad = Math.min(window.devicePixelRatio || 1, 2);
    if (e.renderer.getPixelRatio() !== densidad) e.renderer.setPixelRatio(densidad);

    e.renderer.setSize(w, h, false);
    e.camera.aspect = w / h;
    // En pantallas estrechas se abre el campo para que la nube siga entrando
    // entera en vez de quedar recortada por los lados.
    e.camera.fov = w < 700 ? 74 : 55;
    e.camera.updateProjectionMatrix();
  }

  /* ── Ciclo de vida ─────────────────────────────────────────────────────── */

  function destroy() {
    if (!_estado) return;
    _pausar(_estado);
    _estado.observador?.disconnect();
    _estado.resizeObs?.disconnect();
    window.removeEventListener('pointermove', _estado.onPointer);
    document.removeEventListener('visibilitychange', _estado.onVisibility);

    // Liberar la GPU explícitamente: el recolector de basura no sabe de
    // texturas ni de buffers de WebGL.
    _estado.puntos.geometry.dispose();
    _estado.puntos.material.map?.dispose();
    _estado.puntos.material.dispose();
    _estado.enlaces.geometry.dispose();
    _estado.enlaces.material.dispose();
    _estado.renderer.dispose();
    _estado.renderer.domElement.remove();
    _estado = null;
  }

  async function init() {
    if (_estado || _cargando) return;
    const host = document.querySelector(SELECTOR_HOST);
    if (!_deberiaDibujar(host)) return;

    _cargando = (async () => {
      let THREE;
      try {
        THREE = await import('../vendor/three.module.js');
      } catch {
        // Si no carga, el hero se queda con su fondo CSS y nadie se entera.
        return;
      }

      const e = await _construir(host, THREE);
      _estado = e;
      _ajustar(e);
      _recalcularEnlaces(e);

      /* Pausa cuando el hero sale de pantalla. Sin esto el bucle sigue
         consumiendo GPU mientras se lee el resto de la página. */
      e.observador = new IntersectionObserver(([entrada]) => {
        e.visible = entrada.isIntersecting;
        if (e.visible && !document.hidden) _reanudar(e); else _pausar(e);
      }, { threshold: 0.01 });
      e.observador.observe(host);

      // Y también con la pestaña en segundo plano.
      e.onVisibility = () => {
        if (document.hidden || !e.visible) _pausar(e); else _reanudar(e);
      };
      document.addEventListener('visibilitychange', e.onVisibility);

      // El ratón solo manda donde hay puntero fino; en táctil no aporta nada.
      if (window.matchMedia('(pointer: fine)').matches) {
        e.onPointer = (ev) => {
          e.raton.objetivoX = (ev.clientX / window.innerWidth) * 2 - 1;
          e.raton.objetivoY = -((ev.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener('pointermove', e.onPointer, { passive: true });
      }

      e.resizeObs = new ResizeObserver(() => _ajustar(e));
      e.resizeObs.observe(host);

      host.classList.add('is-ready');
      if (e.visible && !document.hidden) {
        _bucle(e);
        _marcar(e, 'running');
      } else {
        _marcar(e, 'paused');
      }
    })();

    await _cargando;
    _cargando = null;
  }

  return { init, destroy };

})();

/* Arranque propio: asi no hace falta tocar los <script> inline de las paginas,
   cuyos hashes estan fijados en la CSP. */
if (typeof window !== 'undefined') {
  const arrancar = () => {
    if (document.querySelector('[data-neural-bg]')) NeuralBackground.init();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar, { once: true });
  } else {
    arrancar();
  }
}

if (typeof module !== 'undefined') module.exports = NeuralBackground;
