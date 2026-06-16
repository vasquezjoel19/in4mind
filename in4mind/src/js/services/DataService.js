/**
 * IN4MIND — Capa de Datos (Data Service)
 * Fuente de verdad central para toda la información de la aplicación.
 * En producción, estos datos vendrían de una API REST.
 */

'use strict';

const DataService = (() => {

  const COURSES = [
    { id: 'canvas',      title: 'Canvas',      desc: 'Diseño visual profesional y creación de contenido gráfico.',       icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968170.png', color: 'var(--clr-canvas)',  category: 'design',      tags: ['diseño', 'gráfico', 'canvas', 'visual'] },
    { id: 'figma',       title: 'Figma',        desc: 'Diseño de interfaces y prototipos colaborativos.',                 icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png', color: 'var(--clr-figma)',   category: 'design',      tags: ['ui', 'ux', 'figma', 'prototipo'] },
    { id: 'python',      title: 'Python',       desc: 'Programación versátil para automatización y datos.',              icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968350.png', color: 'var(--clr-python)',  category: 'programming', tags: ['python', 'programación', 'scripts', 'automatización'] },
    { id: 'javascript',  title: 'JavaScript',   desc: 'Interactividad y dinamismo para la web moderna.',                 icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png', color: 'var(--clr-js)',      category: 'web',         tags: ['js', 'javascript', 'web', 'frontend'] },
    { id: 'html',        title: 'HTML',         desc: 'Estructura y semántica de páginas web.',                          icon: 'https://cdn-icons-png.flaticon.com/512/732/732212.png',   color: 'var(--clr-html)',    category: 'web',         tags: ['html', 'web', 'estructura', 'marcado'] },
    { id: 'css',         title: 'CSS',          desc: 'Estilos, animaciones y diseño responsivo.',                       icon: 'https://cdn-icons-png.flaticon.com/512/732/732190.png',   color: 'var(--clr-css)',     category: 'web',         tags: ['css', 'estilos', 'web', 'diseño'] },
    { id: 'github',      title: 'GitHub',       desc: 'Control de versiones y colaboración en proyectos.',               icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',     color: 'var(--clr-github)',  category: 'tools',       tags: ['github', 'git', 'versiones', 'repositorio'] },
    { id: 'excel',       title: 'Excel',        desc: 'Gestión y análisis de datos con hojas de cálculo.',               icon: 'https://cdn-icons-png.flaticon.com/512/732/732220.png',   color: 'var(--clr-excel)',   category: 'office',      tags: ['excel', 'datos', 'fórmulas', 'tablas'] },
    { id: 'powerpoint',  title: 'PowerPoint',   desc: 'Presentaciones visuales de impacto corporativo.',                 icon: 'https://cdn-icons-png.flaticon.com/512/732/732224.png',   color: 'var(--clr-pptx)',    category: 'office',      tags: ['powerpoint', 'presentaciones', 'slides'] },
    { id: 'sql',         title: 'SQL',          desc: 'Consultas y gestión de bases de datos relacionales.',             icon: 'https://cdn-icons-png.flaticon.com/512/4248/4248443.png', color: 'var(--clr-sql)',     category: 'data',        tags: ['sql', 'bases de datos', 'consultas', 'datos'] },
    { id: 'cybersecurity', title: 'Ciberseguridad', desc: 'Protege sistemas, datos y usuarios frente a amenazas digitales.', icon: 'https://cdn-icons-png.flaticon.com/512/2913/2913133.png', color: 'var(--clr-security)', category: 'security', tags: ['ciberseguridad', 'seguridad', 'phishing', 'malware', 'contraseñas', 'hacking'] },
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
    { id: 'tutorials', label: 'Tutoriales', icon: 'book', href: 'tutorial.html'  },
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

  function getCourses(query = '') {
    if (!query.trim()) return COURSES;
    const q = query.toLowerCase();
    return COURSES.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q)  ||
      c.tags.some(t => t.includes(q))
    );
  }

  function getCoursesByCategory(category) {
    return COURSES.filter(c => c.category === category);
  }

  function getRecentItems() { return RECENT_ITEMS; }
  function getNavItems()    { return NAV_ITEMS;    }
  function getNavFooter()   { return NAV_FOOTER;   }

  /**
   * Simula login. Busca al usuario registrado en memoria o acepta cualquier
   * credencial válida (demo). El name siempre viene del registro, nunca del email.
   */
  function login(email, password) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!email || password.length < 6) {
          resolve({ ok: false, error: 'Credenciales inválidas.' });
          return;
        }
        // Si el usuario se registró en esta sesión, usar su nombre real
        const registered = _users[email.toLowerCase()];
        if (registered) {
          if (registered.password !== password) {
            resolve({ ok: false, error: 'Contraseña incorrecta.' });
            return;
          }
          resolve({ ok: true, user: { name: registered.name, email } });
        } else {
          // Demo: cualquier email+contraseña válidos accede
          resolve({ ok: true, user: { name: email.split('@')[0], email } });
        }
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
        // Guardar en memoria para que login lo recupere
        _users[email.toLowerCase()] = { name, password };
        _saveUsers(_users);
        resolve({ ok: true, user: { name, email } });
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

        const token = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
        const payload = {
          email: normalized,
          token,
          expires: Date.now() + 30 * 60 * 1000,
        };
        localStorage.setItem(RESET_KEY, JSON.stringify(payload));

        resolve({
          ok: true,
          email: normalized,
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

        const existing = _users[normalized];
        if (existing) {
          _users[normalized] = { ...existing, password: newPassword };
        } else {
          const name = normalized.split('@')[0];
          _users[normalized] = { name, password: newPassword };
        }
        _saveUsers(_users);
        localStorage.removeItem(RESET_KEY);

        resolve({ ok: true, email: normalized });
      }, 800);
    });
  }

  return {
    getCourses, getCoursesByCategory, getRecentItems, getNavItems, getNavFooter,
    login, register, requestPasswordReset, resetPassword,
  };

})();

if (typeof module !== 'undefined') module.exports = DataService;
