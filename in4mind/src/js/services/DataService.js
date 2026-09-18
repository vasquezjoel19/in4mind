/**
 * IN4MIND — Capa de Datos (Data Service)
 * Fuente de verdad central para toda la información de la aplicación.
 * En producción, estos datos vendrían de una API REST.
 */

'use strict';

const DataService = (() => {

  const COURSES = [
    { id: 'canvas',      title: 'Canvas',      desc: 'Diseño visual profesional y creación de contenido gráfico.',       icon: 'src/img/courses/canva.svg?v=20260713', color: 'var(--clr-canvas)',  category: 'design',      tags: ['diseño', 'gráfico', 'canva', 'canvas', 'visual'] },
    { id: 'figma',       title: 'Figma',        desc: 'Diseño de interfaces y prototipos colaborativos.',                 icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png', color: 'var(--clr-figma)',   category: 'design',      tags: ['ui', 'ux', 'figma', 'prototipo'] },
    { id: 'python',      title: 'Python',       desc: 'Programación versátil para automatización y datos.',              icon: 'src/img/courses/python.svg', color: 'var(--clr-python)',  category: 'programming', tags: ['python', 'programación', 'scripts', 'automatización'] },
    { id: 'javascript',  title: 'JavaScript',   desc: 'Interactividad y dinamismo para la web moderna.',                 icon: 'src/img/courses/javascript.svg', color: 'var(--clr-js)',      category: 'web',         tags: ['js', 'javascript', 'web', 'frontend'] },
    { id: 'html',        title: 'HTML',         desc: 'Estructura y semántica de páginas web.',                          icon: 'src/img/courses/html.svg', color: 'var(--clr-html)',    category: 'web',         tags: ['html', 'web', 'estructura', 'marcado'] },
    { id: 'css',         title: 'CSS',          desc: 'Estilos, animaciones y diseño responsivo.',                       icon: 'https://cdn-icons-png.flaticon.com/512/732/732190.png',   color: 'var(--clr-css)',     category: 'web',         tags: ['css', 'estilos', 'web', 'diseño'] },
    { id: 'github',      title: 'GitHub',       desc: 'Control de versiones y colaboración en proyectos.',               icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',     color: 'var(--clr-github)',  category: 'tools',       tags: ['github', 'git', 'versiones', 'repositorio'] },
    { id: 'excel',       title: 'Excel',        desc: 'Gestión y análisis de datos con hojas de cálculo.',               icon: 'https://cdn-icons-png.flaticon.com/512/732/732220.png',   color: 'var(--clr-excel)',   category: 'office',      tags: ['excel', 'datos', 'fórmulas', 'tablas'] },
    { id: 'powerpoint',  title: 'PowerPoint',   desc: 'Presentaciones visuales de impacto corporativo.',                 icon: 'https://cdn-icons-png.flaticon.com/512/732/732224.png',   color: 'var(--clr-pptx)',    category: 'office',      tags: ['powerpoint', 'presentaciones', 'slides'] },
    { id: 'sql',         title: 'SQL',          desc: 'Consultas y gestión de bases de datos relacionales.',             icon: 'src/img/courses/sql.svg', color: 'var(--clr-sql)',     category: 'data',        tags: ['sql', 'bases de datos', 'consultas', 'datos'] },
    { id: 'cybersecurity', title: 'Ciberseguridad', desc: 'Protege sistemas, datos y usuarios frente a amenazas digitales.', icon: 'src/img/courses/security.svg', color: 'var(--clr-security)', category: 'security', tags: ['ciberseguridad', 'seguridad', 'phishing', 'malware', 'contraseñas', 'hacking'] },
    ...(typeof ExtendedCourses !== 'undefined' ? ExtendedCourses.getCatalogEntries() : []),
  ];

  const RECENT_ITEMS = [
    { id: 'r1', courseId: 'python',     title: 'Bases de Python',     subtitle: 'Fundamentos',          timeLabel: 'Visto hace 2 min' },
    { id: 'r2', courseId: 'canvas',     title: 'Iniciando Canvas',    subtitle: 'Uso básico',           timeLabel: 'Hace 15 min'     },
    { id: 'r3', courseId: 'excel',      title: 'Principios de Excel', subtitle: 'Funciones esenciales', timeLabel: 'Hace 1 hora'     },
    { id: 'r4', courseId: 'javascript', title: 'Lógica de JS',        subtitle: 'Introducción',         timeLabel: 'Ayer'            },
    { id: 'r5', courseId: 'html',       title: 'Etiquetas HTML',      subtitle: 'Estructura web',       timeLabel: 'Ayer'            },
    { id: 'r6', courseId: 'github',     title: 'Git básico',          subtitle: 'Control de versiones', timeLabel: 'Hace 2 días'     },
    { id: 'r7', courseId: 'figma',      title: 'UI con Figma',        subtitle: 'Prototipos',           timeLabel: 'Hace 3 días'     },
    { id: 'r8', courseId: 'sql',        title: 'Consultas SQL',       subtitle: 'SELECT y JOINs',       timeLabel: 'Hace 1 semana'   },
    { id: 'r9', courseId: 'cybersecurity', title: 'Fundamentos de ciberseguridad', subtitle: 'Phishing y contraseñas', timeLabel: 'Hace 4 días' },
  ];

  const NAV_ITEMS = [
    { id: 'home',      label: 'Inicio',     icon: 'home', href: 'dashboard.html' },
    { id: 'tutorials', label: 'Cursos', icon: 'book', href: 'tutorial.html'  },
    { id: 'quizzes',   label: 'Quizzes',    icon: 'quiz', href: 'quizzes.html'   },
    { id: 'ai',        label: 'IA',         icon: 'bot',  href: 'ai.html'        },
  ];

  const NAV_FOOTER = [
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
    { id: 'other',    label: 'Otros',   icon: 'more'     },
  ];

  // ── Almacén de usuarios (persistido en localStorage para demo) ──
  const USERS_KEY = 'in4mind_users';
  const RESET_KEY = 'in4mind_reset';

  function _loadUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  let _users = _loadUsers();

  /* ── Credenciales del modo demo ──────────────────────────────────────────
   * Este almacén solo se usa cuando Supabase no está disponible, pero aun así
   * guardaba la contraseña en claro en localStorage. Cualquier XSS o extensión
   * podía leerla, y como la gente reutiliza contraseñas el daño se extendía
   * fuera de esta aplicación. Ahora se guarda una derivación PBKDF2 con sal
   * por usuario, que no permite recuperar el original.
   */
  const PBKDF2_ITERATIONS = 150000;
  const SALT_BYTES = 16;

  const _crypto = typeof crypto !== 'undefined' ? crypto : null;

  function _toHex(bytes) {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  function _fromHex(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  /**
   * Token imprevisible. `Math.random()` no es criptográfico: su estado interno
   * se puede reconstruir observando unas pocas salidas, así que un token de
   * recuperación generado así es adivinable.
   */
  function _randomToken(bytes = 32) {
    if (_crypto?.getRandomValues) {
      return _toHex(_crypto.getRandomValues(new Uint8Array(bytes)));
    }
    // Sin WebCrypto no se emite token: es preferible fallar a dar uno débil.
    return '';
  }

  /** @returns {Promise<{salt: string, hash: string, iterations: number}>} */
  async function _hashPassword(password, saltHex) {
    const salt = saltHex ? _fromHex(saltHex) : _crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const key = await _crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await _crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256
    );
    return { salt: _toHex(salt), hash: _toHex(new Uint8Array(bits)), iterations: PBKDF2_ITERATIONS };
  }

  /** Comparación en tiempo constante: no revela cuántos caracteres coinciden. */
  function _safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  async function _verifyPassword(record, password) {
    if (!record?.hash || !record?.salt) return false;
    const { hash } = await _hashPassword(password, record.salt);
    return _safeEqual(hash, record.hash);
  }

  /**
   * Migra los usuarios que quedaron guardados con la contraseña en claro.
   * Se ejecuta al arrancar: dejar de escribirla no la borra de quien ya la
   * tiene guardada en su navegador.
   */
  async function _migrateLegacyPasswords() {
    if (!_crypto?.subtle) return;
    const pending = Object.entries(_users).filter(([, u]) => u && typeof u.password === 'string');
    if (!pending.length) return;

    for (const [email, user] of pending) {
      try {
        const { salt, hash, iterations } = await _hashPassword(user.password);
        const { password, ...rest } = user;   // descarta el texto en claro
        _users[email] = { ...rest, salt, hash, iterations };
      } catch {
        // Si no se puede derivar, se borra igualmente: mejor pedir un registro
        // nuevo que conservar la contraseña legible.
        const { password, ...rest } = user;
        _users[email] = rest;
      }
    }
    _saveUsers(_users);
  }

  if (typeof window !== 'undefined') _migrateLegacyPasswords();

  function _localizedCourses() {
    return COURSES.map(c => {
      const loc = typeof I18n !== 'undefined' ? I18n.t(`courses.${c.id}`) : null;
      if (loc && typeof loc === 'object') {
        return { ...c, title: loc.title || c.title, desc: loc.desc || c.desc };
      }
      return { ...c };
    });
  }

  function _localizedRecent() {
    return RECENT_ITEMS.map(r => {
      const loc = typeof I18n !== 'undefined' ? I18n.t(`recent.${r.id}`) : null;
      if (loc && typeof loc === 'object') {
        return { ...r, title: loc.title, subtitle: loc.subtitle, timeLabel: loc.time };
      }
      return { ...r };
    });
  }

  function getCourses(query = '') {
    let list = _localizedCourses();
    if (typeof ContentLoader !== 'undefined') {
      list = ContentLoader.applyOverlay(list);
    }
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q)  ||
      c.tags.some(t => t.includes(q))
    );
  }

  function getCoursesByCategory(category) {
    return _localizedCourses().filter(c => c.category === category);
  }

  function getRecentItems() { return _localizedRecent(); }

  function getNavItems() {
    return [
      { id: 'home',      label: typeof I18n !== 'undefined' ? I18n.t('nav.home') : 'Inicio',     icon: 'home',     href: 'dashboard.html' },
      { id: 'tutorials', label: typeof I18n !== 'undefined' ? I18n.t('nav.tutorials') : 'Cursos', icon: 'book',     href: 'tutorial.html'  },
      { id: 'notes',     label: typeof I18n !== 'undefined' ? I18n.t('nav.notes') : 'Notas',     icon: 'notes',    href: 'notes.html'     },
      { id: 'projects',  label: typeof I18n !== 'undefined' ? I18n.t('nav.projects') : 'Proyectos', icon: 'projects', href: 'projects.html'  },
      { id: 'guided',    label: typeof I18n !== 'undefined' ? I18n.t('nav.guided') : 'Guiados',  icon: 'guided',   href: 'guided-projects.html' },
      { id: 'quizzes',   label: typeof I18n !== 'undefined' ? I18n.t('nav.quizzes') : 'Quizzes',    icon: 'quiz',     href: 'quizzes.html'   },
      { id: 'ai',        label: typeof I18n !== 'undefined' ? I18n.t('nav.ai') : 'IA',         icon: 'bot',      href: 'ai.html'        },
    ];
  }

  function getNavFooter() {
    return [
      { id: 'settings', label: typeof I18n !== 'undefined' ? I18n.t('nav.settings') : 'Ajustes', icon: 'settings' },
      { id: 'other',    label: typeof I18n !== 'undefined' ? I18n.t('nav.other') : 'Otros',   icon: 'more'     },
    ];
  }

  /**
   * Simula login local (solo si Supabase no está disponible).
   * Exige un usuario registrado en este dispositivo; ya no acepta credenciales arbitrarias.
   */
  function login(email, password) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!email || password.length < 6) {
          resolve({ ok: false, error: typeof I18n !== 'undefined' ? I18n.t('auth.invalidCreds') : 'Credenciales inválidas.' });
          return;
        }
        const registered = _users[email.toLowerCase()];
        if (!registered) {
          resolve({
            ok: false,
            error: typeof I18n !== 'undefined'
              ? I18n.t('auth.errLogin')
              : 'Credenciales incorrectas. Regístrate o usa una cuenta válida.',
          });
          return;
        }
        _verifyPassword(registered, password).then(valid => {
          if (!valid) {
            resolve({ ok: false, error: typeof I18n !== 'undefined' ? I18n.t('auth.wrongPassword') : 'Contraseña incorrecta.' });
            return;
          }
          resolve({ ok: true, user: { name: registered.name, email } });
        }).catch(() => {
          resolve({ ok: false, error: typeof I18n !== 'undefined' ? I18n.t('auth.wrongPassword') : 'Contraseña incorrecta.' });
        });
      }, 800);
    });
  }

  /**
   * Simula registro. Guarda usuario en memoria para que el login lo encuentre.
   */
  function register(name, email, password) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!name || !email || password.length < 6) {
          resolve({ ok: false, error: 'Por favor completa todos los campos.' });
          return;
        }
        /* Se guarda la derivación PBKDF2, nunca la contraseña. El `resolve` va
           dentro: si respondiera antes, el usuario podría intentar entrar con
           una cuenta que todavía no se ha escrito, y un fallo al derivar
           daría un registro "correcto" sin cuenta creada. */
        _hashPassword(password).then(({ salt, hash, iterations }) => {
          _users[email.toLowerCase()] = { name, salt, hash, iterations };
          _saveUsers(_users);
          resolve({ ok: true, user: { name, email } });
        }).catch(() => {
          resolve({
            ok: false,
            error: 'No se pudo completar el registro en este navegador.',
          });
        });
      }, 800);
    });
  }

  /**
   * Solicita recuperación de contraseña (simula envío de correo).
   * Genera un token de restablecimiento válido 30 minutos.
   */
  function requestPasswordReset(email) {
    return new Promise(resolve => {
      setTimeout(() => {
        const normalized = email.trim().toLowerCase();
        if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
          resolve({ ok: false, error: 'Introduce un correo electrónico válido.' });
          return;
        }

        const token = _randomToken();
        if (!token) {
          resolve({ ok: false, error: 'Este navegador no permite generar un enlace seguro.' });
          return;
        }
        const payload = {
          email: normalized,
          token,
          expires: Date.now() + 30 * 60 * 1000,
        };
        localStorage.setItem(RESET_KEY, JSON.stringify(payload));

        resolve({
          ok: true,
          email: normalized,
          // El token se entrega para que AuthService pueda incluirlo en el
          // enlace del correo que envía la función serverless.
          token,
          registered: Boolean(_users[normalized]),
        });
      }, 900);
    });
  }

  /**
   * Restablece la contraseña con el token generado.
   */
  function resetPassword(email, newPassword, confirmPassword) {
    return new Promise(resolve => {
      setTimeout(() => {
        const normalized = email.trim().toLowerCase();

        if (!newPassword || newPassword.length < 6) {
          resolve({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' });
          return;
        }
        if (newPassword !== confirmPassword) {
          resolve({ ok: false, error: 'Las contraseñas no coinciden.' });
          return;
        }
        if (!/^[\x20-\x7E]+$/.test(newPassword)) {
          resolve({ ok: false, error: 'Usa solo caracteres estándar (sin emojis).' });
          return;
        }

        let resetData;
        try {
          resetData = JSON.parse(localStorage.getItem(RESET_KEY) || 'null');
        } catch {
          resetData = null;
        }

        if (!resetData || resetData.email !== normalized) {
          resolve({ ok: false, error: 'Solicita un nuevo enlace de recuperación.' });
          return;
        }
        if (Date.now() > resetData.expires) {
          localStorage.removeItem(RESET_KEY);
          resolve({ ok: false, error: 'El enlace ha expirado. Solicita uno nuevo.' });
          return;
        }

        _hashPassword(newPassword).then(({ salt, hash, iterations }) => {
          const existing = _users[normalized];
          const name = existing?.name || normalized.split('@')[0];
          // Se reconstruye el registro entero para no arrastrar un campo
          // `password` heredado de la versión anterior.
          _users[normalized] = { name, salt, hash, iterations };
          _saveUsers(_users);
          localStorage.removeItem(RESET_KEY);

          resolve({ ok: true, email: normalized });
        }).catch(() => {
          resolve({ ok: false, error: 'No se pudo cambiar la contraseña en este navegador.' });
        });
      }, 800);
    });
  }

  return {
    getCourses, getCoursesByCategory, getRecentItems, getNavItems, getNavFooter,
    login, register, requestPasswordReset, resetPassword,
  };

})();

if (typeof module !== 'undefined') module.exports = DataService;
