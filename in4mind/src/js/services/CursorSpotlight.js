'use strict';

/**
 * IN4MIND — Fluid cursor (Lusion-style glass refraction trail).
 * Tuned heightfield + glass shading in brand blues/teal.
 * CSS spotlight fallback if WebGL fails. Off on mobile / reduced-motion.
 */
const CursorSpotlight = (() => {
  let wrap = null;
  let canvas = null;
  let gl = null;
  let raf = 0;
  let bound = false;
  let intensity = 'landing';
  let mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moving: false };
  let velS = { x: 0, y: 0 };
  let lastMove = 0;
  let dpr = 1;

  let texA = null;
  let texB = null;
  let fboA = null;
  let fboB = null;
  let simW = 0;
  let simH = 0;
  let quadBuf = null;
  let stampProg = null;
  let fadeProg = null;
  let shadeProg = null;
  let stampLoc = null;
  let fadeLoc = null;
  let shadeLoc = null;
  let useA = true;

  function _enabled() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.matchMedia('(max-width: 768px)').matches) return false;
    if (window.matchMedia('(pointer: coarse)').matches) return false;
    return true;
  }

  function _compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[CursorSpotlight]', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function _program(vsSrc, fsSrc) {
    const vs = _compile(gl.VERTEX_SHADER, vsSrc);
    const fs = _compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('[CursorSpotlight]', gl.getProgramInfoLog(p));
      gl.deleteProgram(p);
      return null;
    }
    return p;
  }

  const VERT = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  /* Decay + light diffusion = softer liquid body */
  const FS_FADE = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform vec2 u_texel;
    uniform float u_decay;
    void main() {
      float c = texture2D(u_tex, v_uv).r;
      float n = texture2D(u_tex, v_uv + vec2(0.0, u_texel.y)).r;
      float s = texture2D(u_tex, v_uv - vec2(0.0, u_texel.y)).r;
      float e = texture2D(u_tex, v_uv + vec2(u_texel.x, 0.0)).r;
      float w = texture2D(u_tex, v_uv - vec2(u_texel.x, 0.0)).r;
      float h = (c * 0.55 + (n + s + e + w) * 0.1125) * u_decay;
      gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
    }
  `;

  /* Continuous capsule stamp between last and current point */
  const FS_STAMP = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform vec2 u_from;
    uniform vec2 u_to;
    uniform float u_radius;
    uniform float u_strength;

    float distToSegment(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a;
      vec2 ba = b - a;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
      return length(pa - ba * h);
    }

    void main() {
      float prevH = texture2D(u_tex, v_uv).r;
      float dist = distToSegment(v_uv, u_from, u_to);
      float stamp = exp(-(dist * dist) / (u_radius * u_radius)) * u_strength;
      float halo = exp(-(dist * dist) / (u_radius * u_radius * 2.8)) * u_strength * 0.22;
      float h = min(1.0, prevH + stamp + halo);
      gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
    }
  `;

  /* Stronger fine glass — transparent fill, sharp rim (IN4MIND blues/teal) */
  const FS_SHADE = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform vec2 u_texel;
    uniform float u_gain;
    uniform float u_chroma;

    void main() {
      float c  = texture2D(u_tex, v_uv).r;
      if (c < 0.01) {
        gl_FragColor = vec4(0.0);
        return;
      }

      float l  = texture2D(u_tex, v_uv - vec2(u_texel.x, 0.0)).r;
      float r  = texture2D(u_tex, v_uv + vec2(u_texel.x, 0.0)).r;
      float dn = texture2D(u_tex, v_uv - vec2(0.0, u_texel.y)).r;
      float up = texture2D(u_tex, v_uv + vec2(0.0, u_texel.y)).r;

      vec2 grad = vec2(r - l, up - dn);
      float gLen = length(grad);
      vec3 n = normalize(vec3(-grad * 6.0, 0.34 + c * 0.66));

      float fres = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.35);
      float rim  = pow(fres, 1.7);
      float spec = pow(clamp(n.z, 0.0, 1.0), 32.0);
      float body = smoothstep(0.06, 0.55, c);

      vec3 blue = vec3(0.29, 0.46, 0.70);
      vec3 sky  = vec3(0.50, 0.68, 0.86);
      vec3 teal = vec3(0.05, 0.58, 0.53);
      vec3 glass = vec3(0.78, 0.88, 0.95);

      float band = 0.5 + 0.5 * sin(atan(n.y, n.x) * 2.0 + c * 5.0);
      vec3 fluid = mix(blue, teal, band * 0.5);
      fluid = mix(fluid, sky, fres * 0.4);

      vec3 color = fluid * (0.28 + body * 0.22);
      color = mix(color, glass, rim * 0.38 + spec * 0.2);
      color += glass * spec * 0.16;
      color += sky * fres * 0.1;

      float fringe = clamp(gLen * u_chroma, 0.0, 1.0);
      color.r += fringe * 0.07;
      color.b += fringe * 0.14;
      color.g += fringe * 0.035;

      float alpha = smoothstep(0.018, 0.3, c) * u_gain;
      alpha *= 0.12 + rim * 0.85 + gLen * 3.2 + spec * 0.18;
      alpha = min(0.62, alpha);

      gl_FragColor = vec4(color * alpha, alpha);
    }
  `;

  function _makeTex(w, h) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return t;
  }

  function _makeFbo(tex) {
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return f;
  }

  function _drawQuad(prog) {
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function _resizeSim() {
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    simW = Math.max(220, Math.floor(cssW * 0.48));
    simH = Math.max(124, Math.floor(cssH * 0.48));

    if (texA) gl.deleteTexture(texA);
    if (texB) gl.deleteTexture(texB);
    if (fboA) gl.deleteFramebuffer(fboA);
    if (fboB) gl.deleteFramebuffer(fboB);

    texA = _makeTex(simW, simH);
    texB = _makeTex(simW, simH);
    fboA = _makeFbo(texA);
    fboB = _makeFbo(texB);
    useA = true;
  }

  function _initGl() {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return false;

    fadeProg = _program(VERT, FS_FADE);
    stampProg = _program(VERT, FS_STAMP);
    shadeProg = _program(VERT, FS_SHADE);
    if (!fadeProg || !stampProg || !shadeProg) return false;

    fadeLoc = {
      tex: gl.getUniformLocation(fadeProg, 'u_tex'),
      texel: gl.getUniformLocation(fadeProg, 'u_texel'),
      decay: gl.getUniformLocation(fadeProg, 'u_decay'),
    };
    stampLoc = {
      tex: gl.getUniformLocation(stampProg, 'u_tex'),
      from: gl.getUniformLocation(stampProg, 'u_from'),
      to: gl.getUniformLocation(stampProg, 'u_to'),
      radius: gl.getUniformLocation(stampProg, 'u_radius'),
      strength: gl.getUniformLocation(stampProg, 'u_strength'),
    };
    shadeLoc = {
      tex: gl.getUniformLocation(shadeProg, 'u_tex'),
      texel: gl.getUniformLocation(shadeProg, 'u_texel'),
      gain: gl.getUniformLocation(shadeProg, 'u_gain'),
      chroma: gl.getUniformLocation(shadeProg, 'u_chroma'),
    };

    quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    _resizeSim();
    return true;
  }

  function _readPair() {
    return useA
      ? { srcTex: texA, dstFbo: fboB }
      : { srcTex: texB, dstFbo: fboA };
  }

  function _frame() {
    raf = requestAnimationFrame(_frame);
    if (!gl) return;

    const now = performance.now();
    const idle = now - lastMove > 140;
    const fromX = mouse.px;
    const fromY = mouse.py;
    let vx = mouse.x - fromX;
    let vy = mouse.y - fromY;
    mouse.px = mouse.x;
    mouse.py = mouse.y;

    const spRaw = Math.hypot(vx, vy);
    if (spRaw > 0.12) {
      const s = 0.12 / spRaw;
      vx *= s;
      vy *= s;
    }
    velS.x += (vx - velS.x) * 0.4;
    velS.y += (vy - velS.y) * 0.4;

    const isApp = intensity === 'app';
    const decay = isApp ? 0.955 : 0.965;
    /* slightly tighter radius = finer line, still continuous via capsule */
    const radius = isApp ? 0.028 : 0.034;
    const speed = Math.hypot(velS.x, velS.y);
    /* floor strength so slow motion stays continuous (not dotted) */
    const base = isApp ? 0.48 : 0.62;
    const strength = idle ? 0 : base * (0.85 + Math.min(0.4, speed * 8));
    const gain = isApp ? 0.7 : 0.92;
    const chroma = isApp ? 2.0 : 2.6;

    let pair = _readPair();
    gl.bindFramebuffer(gl.FRAMEBUFFER, pair.dstFbo);
    gl.viewport(0, 0, simW, simH);
    gl.useProgram(fadeProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pair.srcTex);
    gl.uniform1i(fadeLoc.tex, 0);
    gl.uniform2f(fadeLoc.texel, 1 / simW, 1 / simH);
    gl.uniform1f(fadeLoc.decay, decay);
    _drawQuad(fadeProg);
    useA = !useA;

    pair = _readPair();
    gl.bindFramebuffer(gl.FRAMEBUFFER, pair.dstFbo);
    gl.viewport(0, 0, simW, simH);
    gl.useProgram(stampProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pair.srcTex);
    gl.uniform1i(stampLoc.tex, 0);
    gl.uniform2f(stampLoc.from, fromX, 1.0 - fromY);
    gl.uniform2f(stampLoc.to, mouse.x, 1.0 - mouse.y);
    gl.uniform1f(stampLoc.radius, radius);
    gl.uniform1f(stampLoc.strength, strength);
    _drawQuad(stampProg);
    useA = !useA;

    const heightTex = useA ? texA : texB;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shadeProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, heightTex);
    gl.uniform1i(shadeLoc.tex, 0);
    gl.uniform2f(shadeLoc.texel, 1 / simW, 1 / simH);
    gl.uniform1f(shadeLoc.gain, gain);
    gl.uniform1f(shadeLoc.chroma, chroma);
    _drawQuad(shadeProg);
  }

  function _ensure() {
    if (wrap) return wrap;
    wrap = document.createElement('div');
    wrap.className = 'in4-cursor-spotlight in4-cursor-spotlight--fluid';
    wrap.setAttribute('aria-hidden', 'true');

    if (!_initGl()) {
      wrap.className = 'in4-cursor-spotlight in4-cursor-spotlight--css';
      document.body.appendChild(wrap);
      gl = null;
      return wrap;
    }

    wrap.appendChild(canvas);
    document.body.appendChild(wrap);
    return wrap;
  }

  function _onMove(e) {
    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;
    if (!mouse.moving) {
      mouse.px = nx;
      mouse.py = ny;
      velS.x = 0;
      velS.y = 0;
    }
    mouse.x = nx;
    mouse.y = ny;
    lastMove = performance.now();
    mouse.moving = true;

    if (wrap && wrap.classList.contains('in4-cursor-spotlight--css')) {
      wrap.style.setProperty('--spot-x', e.clientX + 'px');
      wrap.style.setProperty('--spot-y', e.clientY + 'px');
      wrap.classList.add('is-active');
    } else {
      wrap?.classList.add('is-active');
    }
  }

  function _onLeave() {
    mouse.moving = false;
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    velS.x = 0;
    velS.y = 0;
    wrap?.classList.remove('is-active');
  }

  function _onResize() {
    if (gl) _resizeSim();
  }

  /**
   * @param {{ intensity?: 'landing' | 'app' }} [opts]
   */
  function init(opts = {}) {
    if (!_enabled()) return;

    intensity = opts.intensity === 'app' ? 'app' : 'landing';
    const node = _ensure();
    node.classList.toggle('in4-cursor-spotlight--soft', intensity === 'app');

    if (bound) return;
    bound = true;
    document.addEventListener('mousemove', _onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', _onLeave);
    window.addEventListener('resize', _onResize, { passive: true });

    if (gl) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(_frame);
    }
  }

  return { init };
})();

if (typeof module !== 'undefined') module.exports = CursorSpotlight;
