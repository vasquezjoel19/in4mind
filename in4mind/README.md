# 💡 IN4MIND — Plataforma Educativa de Tecnología

> Aprende tecnología de forma clara, moderna y accesible.

---

## Descripción del Proyecto

**IN4MIND** es una plataforma educativa orientada a personas que desean aprender sobre tecnología (diseño, programación, herramientas de oficina, etc.) de manera accesible y estructurada. La aplicación ofrece:

- **Autenticación** (Login / Registro) con validación en tiempo real
- **Dashboard principal** con carruseles de cursos, sección de recién vistos y asistente IA
- **Tutoriales**: catálogo de cursos con filtros por categoría, búsqueda con debounce y vista detalle por curso (videos, temas, ratings, sección "Sobre el tema" expandible)
- **Quizzes interactivos**: banco de preguntas por tecnología, filtros por categoría, feedback inmediato, pantalla de resultados con revisión y progreso persistido en `sessionStorage`
- **Navegación sidebar** con secciones: Inicio, Tutoriales, Quizzes, IA, Ajustes
- **Búsqueda en tiempo real** de cursos con debounce

Esta es la **versión refactorizada** de la aplicación original (Python/Flet), migrada a una arquitectura web moderna y lista para producción.

---

## Tecnologías Utilizadas

| Capa            | Tecnología / Patrón                                     |
|-----------------|---------------------------------------------------------|
| **Markup**      | HTML5 semántico con atributos ARIA de accesibilidad     |
| **Estilos**     | CSS3 nativo — Variables CSS (Design Tokens), Grid, Flex |
| **Tipografía**  | Google Fonts: Sora (display) + DM Sans (cuerpo)        |
| **Lógica**      | JavaScript ES6+ (Módulos IIFE, sin dependencias)        |
| **Arquitectura**| Patrón MVC: Controllers / Services / Views (HTML)      |
| **Sin build**   | Cero dependencias de build — abre directo en navegador  |

---

## Instalación y Ejecución

### Opción 1 — Abrir directo (más simple)

```bash
# 1. Clona o descomprime el proyecto
unzip in4mind.zip
cd in4mind

# 2. Abre la Home en tu navegador
#    http://localhost:8080/in4mind/          ← Home (landing)
#    http://localhost:8080/in4mind/login.html  ← Login (después de Comenzar)
open in4mind/index.html   # macOS
xdg-open in4mind/index.html  # Linux
start in4mind/index.html  # Windows
```

> ⚠️ Algunas funciones (como Google Fonts externos) requieren conexión a internet.

### Opción 2 — Servidor local (recomendado)

```bash
# Con Python (viene instalado en macOS/Linux)
python3 -m http.server 8080
# → Abre http://localhost:8080

# Con Node.js
npx serve .
# → Abre la URL indicada en consola

# Con VS Code
# Instala la extensión "Live Server" y haz clic en "Go Live"
```

### Credenciales de prueba

En la versión demo, **cualquier email válido con contraseña de 6+ caracteres** accede al dashboard.

```
Email:    demo@in4mind.com
Password: demo123
```

---

## Estructura del Proyecto

```
in4mind/
│
├── index.html              # Home pública (landing — primera página)
├── login.html              # Login / Registro
├── landing.html            # Redirige a index.html (compatibilidad)
├── dashboard.html          # Dashboard principal del usuario
├── tutorial.html           # Catálogo y detalle de tutoriales
├── quizzes.html            # Listado, quiz interactivo y resultados
├── README.md               # Esta documentación
│
└── src/
    ├── css/
    │   ├── tokens.css      # Design tokens: colores, tipografía, espaciado
    │   ├── base.css        # Reset global, tipografía base, animaciones
    │   ├── auth.css        # Estilos de la página de autenticación
    │   ├── dashboard.css   # Estilos del dashboard y sus componentes
    │   ├── tutorial.css    # Estilos del banner, videos, temas y layout de tutorial
    │   └── quizzes.css     # Estilos del banner, grid, filtros, quiz interactivo y resultados
    │
    └── js/
        ├── services/
        │   └── DataService.js          # Capa de datos: cursos, usuarios, navegación
        └── controllers/
            ├── AuthController.js       # Lógica de login, registro y validación
            ├── DashboardController.js  # Renderizado del dashboard y nav
            └── QuizzesController.js    # Lógica de quizzes: grid, interacción y resultados
```

> **Nota:** `TutorialController` está embebido directamente en `tutorial.html` como módulo IIFE inline, siguiendo el mismo patrón arquitectónico que el resto de controladores.

---

### Descripción de cada módulo

#### `src/css/tokens.css`
Fuente única de verdad para colores, radios, sombras, tipografía y espaciado. Editar aquí para cambiar la identidad visual en toda la app.

#### `src/css/base.css`
Reset CSS, clases utilitarias, definición de animaciones globales (`fadeInUp`, `slideInLeft`, etc.) y estilos de scrollbar.

#### `src/css/auth.css`
Estilos para la página de autenticación: tarjeta de dos columnas, vistas de login/registro, inputs, botones y estados de error.

#### `src/css/dashboard.css`
Layout del dashboard: sidebar fijo, topbar sticky, carruseles, tarjetas de curso, tarjetas de recientes y banner de IA. Incluye breakpoints responsivos para móvil.

#### `src/css/tutorial.css`
Estilos de la página de tutoriales: banner de lista, filtros de categoría, grid de tarjetas, banner de detalle, acciones sociales, sección "sobre el tema", grid de videos, timeline de progreso y panel de temas. Responsivo a partir de 1100px y 700px.

#### `src/css/quizzes.css`
Estilos de la página de quizzes: banner, filtros por categoría, grid de tarjetas con barra de progreso, sección "Continuar", tarjeta de quiz interactivo, opciones con feedback visual (correcto / incorrecto), y pantalla de resultados con círculo de puntuación y revisión por pregunta.

#### `src/js/services/DataService.js`
Módulo de datos puro (sin side-effects). Expone:
- `getCourses(query?)` — lista de cursos con filtrado
- `getCoursesByCategory(category)` — cursos por categoría
- `getRecentItems()` — historial de vistos
- `getNavItems() / getNavFooter()` — ítems de navegación
- `login(email, pass)` / `register(name, email, pass)` — simulación de API

#### `src/js/controllers/AuthController.js`
Controla la página de autenticación:
- Alterna vistas Login ↔ Registro con transición suave
- Valida campos en tiempo real (email ASCII estricto, contraseña mínimo 6 caracteres)
- Llama a `DataService.login/register` y gestiona el estado de carga
- Guarda sesión en `sessionStorage` y redirige al dashboard

#### `src/js/controllers/DashboardController.js`
Controla el dashboard:
- Renderiza sidebar (nav items) dinámicamente desde `DataService`
- Renderiza carruseles de cursos con animaciones escalonadas
- Implementa búsqueda con debounce de 300ms
- Gestiona apertura/cierre del sidebar en móvil
- Redirige a `tutorial.html` o `quizzes.html` desde el nav y las tarjetas de curso

#### `src/js/controllers/QuizzesController.js`
Controla la página de quizzes con tres vistas en una misma página:
- **Lista:** grid de tarjetas filtrable por categoría (web, programación, diseño, office, herramientas); barra de progreso por quiz; sección "Continuar" para quizzes en progreso
- **Quiz interactivo:** renderiza pregunta por pregunta, feedback inmediato con explicación, barra de progreso visual
- **Resultados:** círculo de puntuación, estadísticas (correctas / incorrectas / total), revisión completa pregunta a pregunta, botones para reintentar o volver al inicio
- Persiste el progreso en `sessionStorage` bajo la clave `in4mind_quiz_progress`

#### `tutorial.html` → `TutorialController` (inline)
Controla la página de tutoriales con dos vistas:
- **Lista:** grid de cursos filtrable por categoría, búsqueda con debounce, datos extendidos por curso (rating, cantidad de tutoriales y quizzes)
- **Detalle:** banner dinámico con icono, descripción, rating y metadatos; sección "Sobre el tema" con toggle "Leer Más"; grid de videos del curso; timeline de nivel; panel de temas principales; botones Favorito, Guardar y Compartir (toggle visual)
- Lee el id de curso desde `sessionStorage` (`in4mind_open_course`) si viene redirigido desde el dashboard

---

## Paleta de Colores Original (preservada)

| Token                | Valor     | Uso                          |
|----------------------|-----------|------------------------------|
| `--clr-brand-700`    | `#2b4566` | Panel izquierdo auth (inicio)|
| `--clr-brand-900`    | `#142131` | Panel izquierdo auth (fin)   |
| `--clr-brand-500`    | `#3b506d` | Botón primario, sidebar       |
| `--clr-brand-600`    | `#335071` | Nav activo, botones de curso  |
| `--clr-accent`       | `#2c4268` | Títulos de formularios        |
| `--clr-bg-auth`      | `#d8e9f9` | Fondo degradado de auth       |
| `--clr-bg-app`       | `#f4f6fb` | Fondo del dashboard           |
| `--clr-bg-sidebar`   | `#f8fafc` | Sidebar y topbar              |

---

## Buenas Prácticas Aplicadas

- ✅ **Separación de responsabilidades**: CSS → tokens → base → módulos; JS → services → controllers
- ✅ **Accesibilidad (a11y)**: roles ARIA, `aria-label`, `aria-hidden`, `aria-live` en feedback de quizzes, navegación por teclado, estructura semántica HTML5
- ✅ **Código limpio**: funciones pequeñas y nombradas, comentarios JSDoc, sin magic strings
- ✅ **Performance**: debounce en búsqueda, `loading="lazy"` en imágenes, CSS vars en lugar de valores repetidos
- ✅ **Sin dependencias de build**: listo para abrir en cualquier navegador sin npm/webpack
- ✅ **Responsive**: sidebar deslizable en móvil con overlay, layout adaptable a pantallas pequeñas
- ✅ **Validación de formularios**: inline, con estados visuales y mensajes de error claros
- ✅ **Manejo de sesión**: `sessionStorage` para persistencia ligera durante la sesión (progreso de quizzes, usuario logueado, curso seleccionado)

---

## Flujo de Navegación

```
index.html (Home — landing pública)
    └─→ login.html (Comenzar / Explorar temas)
            └─→ dashboard.html (tras iniciar sesión)
                    ├─→ tutorial.html  (nav "Tutoriales" o clic en tarjeta de curso)
                    │       └─→ detalle de curso → quizzes.html
                    ├─→ quizzes.html   (nav "Quizzes")
                    │       └─→ quiz interactivo → resultados → listado / reintentar
                    └─→ ai.html        (nav "IA")
```

---

## Posibles Mejoras (Para Producción)

- [ ] Integrar backend real (Node.js/Express o FastAPI) para autenticación con JWT
- [ ] Reemplazar `sessionStorage` por cookies httpOnly seguras
- [ ] Añadir PWA (Service Worker + Manifest) para uso offline
- [ ] Internacionalización (i18n) para múltiples idiomas
- [ ] Tests unitarios con Jest / Vitest (QuizzesController, TutorialController)
- [ ] Expandir banco de preguntas y cursos desde una API REST
- [ ] Dark mode completo (ya preparado con CSS vars)
- [ ] Reproductor de video integrado en la vista de detalle de tutorial

---

## Licencia

Proyecto educativo — IN4MIND © 2025
