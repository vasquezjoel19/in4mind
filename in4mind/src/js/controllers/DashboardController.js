/**
 * IN4MIND — DashboardController
 * Orquesta el renderizado dinámico del dashboard:
 * sidebar, topbar, carruseles de cursos y sección reciente.
 */

'use strict';

const DashboardController = (() => {

  // ── Estado ──
  let _currentNav   = 'home';
  let _searchTimeout = null;
  const _expanded = { featured: false, learning: false, recent: false };
  const _PREVIEW_LIMIT = { featured: 5, learning: 5, recent: 3 };

  // ── Refs DOM ──
  let $sidebarNav, $sidebarFooter, $welcomeTitle;
  let $featuredTrack, $learningTrack, $recentTrack;
  let $searchInput;
  let $sidebar, $overlay;

  // ────────────────────────────────────────────
  // Helpers de render
  // ────────────────────────────────────────────

  /**
   * Genera el SVG de ícono de navegación según id.
   * @param {string} iconId
   * @returns {string} SVG HTML
   */
  function _navIcon(iconId) {
    const ICONS = {
      home:      '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      book:      '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
      quiz:      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      bot:       '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>',
      settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>',
      user:      '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      more:      '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    };
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[iconId] || ''}</svg>`;
  }

  /**
   * Construye el HTML de un nav-item del sidebar.
   * @param {{ id: string, label: string, icon: string }} item
   * @param {boolean} isActive
   * @returns {string}
   */
  function _renderNavItem(item, isActive = false) {
    const href = item.href || '';
    const inner = `${_navIcon(item.icon)}<span>${item.label}</span>`;
    if (!href) {
      return `
        <li class="nav-item ${isActive ? 'nav-item--active' : ''}"
            data-nav="${item.id}" data-label="${item.label}" role="button" tabindex="0">
          ${inner}
        </li>`;
    }
    return `
      <li role="none">
        <a class="nav-item ${isActive ? 'nav-item--active' : ''}"
           href="${href}" data-nav="${item.id}" data-label="${item.label}">
          ${inner}
        </a>
      </li>`;
  }

  /**
   * Construye el HTML de una tarjeta de curso.
   * @param {import('../services/DataService').Course} course
   * @param {number} delay - índice para animación escalonada
   * @returns {string}
   */
  function _renderCourseCard(course, delay = 0) {
    return `
      <article class="course-card anim-fade-up delay-${Math.min(delay + 1, 6)}"
               data-course="${course.id}" role="button" tabindex="0"
               aria-label="Ver tutoriales de ${course.title}">
        <div class="course-card__header">
          <div class="course-card__icon-wrap">
            <img src="${course.icon}" alt="${course.title}" loading="lazy" width="24" height="24">
          </div>
          <h3 class="course-card__title">${course.title}</h3>
        </div>
        <p class="course-card__desc">${course.desc}</p>
        <div class="course-card__footer">
          <button class="btn--course" data-course="${course.id}">Tutoriales</button>
        </div>
      </article>`;
  }

  /**
   * Construye el HTML de una tarjeta "recién visto".
   * @param {import('../services/DataService').RecentItem} item
   * @param {number} delay
   * @returns {string}
   */
  function _renderRecentCard(item, delay = 0) {
    return `
      <article class="recent-card anim-fade-up delay-${Math.min(delay + 1, 6)}"
               data-recent="${item.id}" data-course="${item.courseId || ''}"
               role="button" tabindex="0"
               aria-label="Continuar ${item.title}">
        <p class="recent-card__title">${item.title}</p>
        <p class="recent-card__sub">${item.subtitle}</p>
        <div class="recent-card__footer">
          <button type="button" class="recent-card__cta" data-course="${item.courseId || ''}">Ver Más</button>
          <span class="recent-card__time">${item.timeLabel}</span>
        </div>
      </article>`;
  }

  function _bindCourseTrack(track) {
    track.querySelectorAll('.course-card, .btn--course').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.course
          || e.currentTarget.closest('[data-course]')?.dataset.course;
        if (id) _handleCourseClick(id);
      });
    });
  }

  function _bindRecentTrack() {
    $recentTrack.querySelectorAll('.recent-card, .recent-card__cta').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.course
          || e.currentTarget.closest('[data-course]')?.dataset.course;
        if (id) _handleCourseClick(id);
      });
      el.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          const id = el.dataset.course || el.closest('[data-course]')?.dataset.course;
          if (id) _handleCourseClick(id);
        }
      });
    });
  }

  function _updateExpandLabels() {
    const labels = {
      featured: { on: 'Ver menos', off: 'Ver todos' },
      learning: { on: 'Ver menos', off: 'Ver todos' },
      recent:   { on: 'Ver menos', off: 'Ver más'   },
    };
    Object.keys(labels).forEach(key => {
      const btn = document.querySelector(`[data-expand="${key}"]`);
      if (!btn) return;
      btn.innerHTML = `${_expanded[key] ? labels[key].on : labels[key].off} &rsaquo;`;
      btn.setAttribute('aria-expanded', String(_expanded[key]));
    });
  }

  function _toggleSection(section) {
    _expanded[section] = !_expanded[section];
    if (section === 'recent') {
      _renderRecent();
    } else {
      _renderCourses($searchInput?.value || '');
    }
    _updateExpandLabels();
  }

  // ────────────────────────────────────────────
  // Render de secciones
  // ────────────────────────────────────────────

  /** Renderiza los ítems de navegación del sidebar. */
  function _renderNav() {
    const main   = DataService.getNavItems();
    const footer = DataService.getNavFooter();

    $sidebarNav.innerHTML   = main.map((it, i) => _renderNavItem(it, it.id === _currentNav)).join('');
    $sidebarFooter.innerHTML = footer.map(it => _renderNavItem(it)).join('');
  }

  /**
   * Renderiza los carruseles de cursos.
   * @param {string} [query=''] - Texto de búsqueda para filtrar
   */
  function _renderCourses(query = '') {
    const all = DataService.getCourses(query);

    const featured = _expanded.featured
      ? all
      : all.slice(0, _PREVIEW_LIMIT.featured);

    const learning = _expanded.learning
      ? all
      : all.slice(_PREVIEW_LIMIT.featured, _PREVIEW_LIMIT.featured + _PREVIEW_LIMIT.learning);

    $featuredTrack.classList.toggle('carousel-track--expanded', _expanded.featured);
    $learningTrack.classList.toggle('carousel-track--expanded', _expanded.learning);

    $featuredTrack.innerHTML = featured.length
      ? featured.map((c, i) => _renderCourseCard(c, i)).join('')
      : '<p style="color:var(--clr-text-muted);font-size:.85rem">Sin resultados.</p>';

    $learningTrack.innerHTML = learning.length
      ? learning.map((c, i) => _renderCourseCard(c, i)).join('')
      : '<p style="color:var(--clr-text-muted);font-size:.85rem">Sin cursos en esta sección.</p>';

    _bindCourseTrack($featuredTrack);
    _bindCourseTrack($learningTrack);
  }

  /** Renderiza la sección de recién vistos desde el perfil del usuario. */
  function _renderRecent() {
    const visits = UserProfileService.getRecentVisits(_expanded.recent ? 24 : _PREVIEW_LIMIT.recent);
    const items = visits.map((v, i) => ({
      id: v.id || `v-${i}`,
      courseId: v.refId,
      title: v.title,
      subtitle: v.desc?.slice(0, 48) || 'Curso',
      timeLabel: UserProfileService.formatVisitDate(v.visitedAt),
    }));

    $recentTrack.classList.toggle('carousel-track--expanded', _expanded.recent);
    $recentTrack.innerHTML = items.length
      ? items.map((it, i) => _renderRecentCard(it, i)).join('')
      : '<p style="color:var(--clr-text-muted);font-size:.85rem">Sin actividad reciente. Explora tutoriales para ver tu historial.</p>';

    _bindRecentTrack();
  }

  // ────────────────────────────────────────────
  // Event handlers
  // ────────────────────────────────────────────

  /** Manejador de clic en ítem de navegación. */
  function _handleNavClick(e) {
    const navId = e.currentTarget.dataset.nav;
    if (!navId || navId === _currentNav) return;

    _currentNav = navId;
    _renderNav();
    _closeSidebar();

    // Secciones con página propia → redirigir
    const SECTION_ROUTES = {
      quizzes:   'quizzes.html',
      tutorials: 'tutorial.html',
      ai:        'ai.html',        // ← ruta a la página IA
    };

    if (SECTION_ROUTES[navId]) {
      window.location.href = SECTION_ROUTES[navId];
      return;
    }

    // Mostrar estado básico por sección (extensible)
    const SECTION_TITLES = {
      home:     '¡Bienvenido, User!',
      settings: 'Ajustes',
    };

    if ($welcomeTitle) {
      $welcomeTitle.textContent = SECTION_TITLES[navId] || 'IN4MIND';
    }
  }

  /**
   * Manejador de clic en tarjeta de curso.
   * @param {string} courseId
   */
  function _handleCourseClick(courseId) {
    if (courseId) {
      sessionStorage.setItem('in4mind_open_course', courseId);
      const course = DataService.getCourses().find(c => c.id === courseId);
      if (course) UserProfileService.recordVisit(UserProfileService.buildCourseItem(course));
    }
    const card = document.querySelector(`.course-card[data-course="${courseId}"]`);
    if (card) {
      card.style.transform = 'scale(0.97)';
      setTimeout(() => {
        card.style.transform = '';
        window.location.href = 'tutorial.html';
      }, 150);
    } else {
      window.location.href = 'tutorial.html';
    }
  }

  /** Cierra el sidebar en móvil. */
  function _closeSidebar() {
    SidebarController.closeMobile();
  }

  /** Abre el sidebar en móvil. */
  function _openSidebar() {
    SidebarController.openMobile();
  }

  /** Maneja búsqueda con debounce de 300ms. */
  function _handleSearch() {
    clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(() => {
      _renderCourses($searchInput.value);
    }, 300);
  }

  /** Maneja el cierre de sesión. */
  function _handleLogout() {
    AppShell.logout();
  }

  // ────────────────────────────────────────────
  // Inicialización
  // ────────────────────────────────────────────

  /** Punto de entrada del dashboard. */
  function init() {
    const userRaw = sessionStorage.getItem('in4mind_user');
    const user    = userRaw ? JSON.parse(userRaw) : null;

    // En producción, descomentar para proteger la ruta:
    // if (!user) { window.location.href = 'login.html'; return; }

    // Cachear DOM
    $sidebarNav    = document.getElementById('sidebar-nav');
    $sidebarFooter = document.getElementById('sidebar-footer');
    $welcomeTitle  = document.getElementById('welcome-title');
    $featuredTrack = document.getElementById('featured-track');
    $learningTrack = document.getElementById('learning-track');
    $recentTrack   = document.getElementById('recent-track');
    $searchInput   = document.getElementById('search-input');
    $sidebar       = document.getElementById('sidebar');
    $overlay       = document.getElementById('sidebar-overlay');

    // Personalizar con nombre de usuario
    if (user && $welcomeTitle) {
      const firstName = user.name.trim().split(/[\s.]+/)[0];
      const name = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      $welcomeTitle.textContent = `¡Bienvenido, ${name}!`;
    }

    // Renderizar contenido
    AppShell.initPage('home');
    _renderCourses();
    _renderRecent();
    _updateExpandLabels();

    document.querySelectorAll('[data-expand]').forEach(btn => {
      btn.addEventListener('click', () => _toggleSection(btn.dataset.expand));
    });

    // Buscador
    $searchInput?.addEventListener('input', _handleSearch);
    $searchInput?.addEventListener('keydown', e => {
      if (e.key === 'Escape') { $searchInput.value = ''; _renderCourses(); }
    });

    // Banner IA → redirigir a ai.html
    document.getElementById('ai-banner')?.addEventListener('click', () => {
      window.location.href = 'ai.html';
    });
  }

  return { init };

})();
