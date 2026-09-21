/**
 * IN4MIND — Motor de aprendizaje adaptativo (diagnóstico invisible).
 *
 * Observa señales que la app ya emite —terminar una lección, cerrar un turno
 * de chat— y, de vez en cuando, propone un micro-quiz de dos preguntas dentro
 * del propio flujo. Si se falla, pide a Groq la causa de fondo en JSON y la
 * guarda como "hueco" del tema, que es lo que luego alimenta el refuerzo y el
 * mapa de dominio.
 *
 * Tres decisiones que conviene tener presentes:
 *
 * 1. **Opt-in de verdad.** Mientras nadie lo active en Ajustes, este módulo no
 *    escucha nada, no guarda nada y no llama a ninguna API. Cargarlo en una
 *    página tiene coste cero.
 *
 * 2. **No interrumpe.** El micro-quiz se inserta en el hueco donde el usuario
 *    ya está mirando y nunca bloquea: ni diálogos modales, ni redirecciones,
 *    ni robo de foco. Además respeta un tiempo de espera entre apariciones y
 *    se calla si la pestaña está oculta o si se está escribiendo.
 *
 * 3. **Local primero.** El estado vive en `localStorage`, particionado por
 *    cuenta con el mismo formato de clave que el resto de la app. No se toca
 *    el esquema de Supabase: esta función es nueva y no debe obligar a migrar
 *    nada para que lo que ya funciona siga igual.
 *
 * El módulo no dibuja: emite `in4mind-adaptive-quiz` con la pregunta y deja
 * que `MicroQuiz.js` decida cómo enseñarla.
 */

'use strict';

const AdaptiveLearningService = (() => {

  const FLAG_KEY = 'in4mind_adaptive_enabled';
  const STATE_KEY = 'in4mind_adaptive_state';
  const STATE_VERSION = 1;

  /* Ritmo. Son los números que evitan que esto se vuelva molesto: sin ellos, un
     usuario que encadena lecciones recibiría un quiz detrás de otro. */
  const COOLDOWN_MS = 6 * 60 * 1000;   // entre micro-quizzes
  const MIN_SIGNALS = 2;               // no aparece en la primera señal de la sesión
  const QUESTIONS_PER_QUIZ = 2;

  /* Umbrales de dominio. Con menos de dos respuestas no se afirma nada: una
     sola acertada por casualidad no es dominio. */
  const MIN_ANSWERS_FOR_VERDICT = 2;
  const MASTERED_ACCURACY = 0.8;
  const GAP_ACCURACY = 0.5;

  const STATUS = {
    MASTERED: 'mastered',
    PROGRESS: 'progress',
    GAP: 'gap',
  };

  let _bound = false;
  let _signals = 0;
  let _pending = false;

  /* ── Almacenamiento ────────────────────────────────────────────────────── */

  /**
   * Cuenta activa, con el mismo formato de clave que usa el resto de la app
   * (`in4mind_algo:cuenta`).
   *
   * No se delega en `UserScopedStorage` a propósito: ese módulo existe pero no
   * lo carga ninguna página, así que estaría presente o ausente según dónde se
   * mire y el interruptor de Ajustes leería un valor distinto en cada pantalla.
   */
  function _account() {
    try {
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      const user = raw ? JSON.parse(raw) : null;
      return String(user?.id || user?.email || 'guest').toLowerCase();
    } catch {
      return 'guest';
    }
  }

  function _key(base) {
    return `${base}:${_account()}`;
  }

  function _read(base, fallback) {
    try {
      const raw = localStorage.getItem(_key(base));
      return raw == null || raw === '' ? fallback : raw;
    } catch {
      return fallback;
    }
  }

  function _write(base, value) {
    try {
      localStorage.setItem(_key(base), value);
      return true;
    } catch {
      return false;   // sin espacio o almacenamiento bloqueado
    }
  }

  function isEnabled() {
    return _read(FLAG_KEY, '0') === '1';
  }

  /**
   * Activa o desactiva el motor. Al apagarlo no se borra lo aprendido: si
   * alguien lo vuelve a encender, su mapa sigue donde lo dejó.
   */
  function setEnabled(on) {
    _write(FLAG_KEY, on ? '1' : '0');
    if (on) init();
    window.dispatchEvent(new CustomEvent('in4mind-adaptive-toggled', { detail: { enabled: !!on } }));
  }

  function _emptyState() {
    return { v: STATE_VERSION, topics: {}, lastQuizAt: 0, updatedAt: 0 };
  }

  function getState() {
    try {
      const raw = JSON.parse(_read(STATE_KEY, 'null'));
      if (!raw || typeof raw !== 'object' || raw.v !== STATE_VERSION) return _emptyState();
      if (!raw.topics || typeof raw.topics !== 'object') raw.topics = {};
      return raw;
    } catch {
      return _emptyState();
    }
  }

  function _saveState(state) {
    state.updatedAt = Date.now();
    _write(STATE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('in4mind-adaptive-updated', { detail: { state } }));
    return state;
  }

  /* ── Temas ─────────────────────────────────────────────────────────────── */

  /** Identificador estable a partir del curso y el concepto. */
  function topicId(courseId, concept) {
    const base = `${courseId || 'general'}:${concept || 'general'}`;
    return base.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9:]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }

  function _blankTopic(id, label, courseId) {
    return {
      id,
      label: label || id,
      courseId: courseId || null,
      seen: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      status: STATUS.PROGRESS,
      gap: null,
      lesson: null,
      updatedAt: 0,
    };
  }

  /**
   * Clasifica un tema. El hueco detectado manda sobre la media: alguien puede
   * acertar de memoria y seguir sin entender el porqué, y es ese porqué lo que
   * el refuerzo tiene que atacar.
   */
  function _classify(topic) {
    if (topic.gap) return STATUS.GAP;
    if (topic.seen < MIN_ANSWERS_FOR_VERDICT) return STATUS.PROGRESS;
    if (topic.accuracy >= MASTERED_ACCURACY) return STATUS.MASTERED;
    if (topic.accuracy < GAP_ACCURACY) return STATUS.GAP;
    return STATUS.PROGRESS;
  }

  function getTopics() {
    const state = getState();
    return Object.values(state.topics).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  function getTopic(id) {
    return getState().topics[id] || null;
  }

  /**
   * Registra una respuesta y devuelve el tema actualizado.
   *
   * @param {{id:string,label?:string,courseId?:string}} topic
   * @param {boolean} correct
   */
  function recordAnswer(topic, correct) {
    if (!topic?.id) return null;
    const state = getState();
    const entry = state.topics[topic.id] || _blankTopic(topic.id, topic.label, topic.courseId);

    entry.label = topic.label || entry.label;
    entry.courseId = topic.courseId || entry.courseId;
    entry.seen += 1;
    if (correct) entry.correct += 1;
    else entry.wrong += 1;
    entry.accuracy = entry.seen ? entry.correct / entry.seen : 0;

    // Acertar dos veces seguidas cierra un hueco abierto: el refuerzo funcionó.
    if (correct && entry.gap && entry.accuracy >= MASTERED_ACCURACY) entry.gap = null;

    entry.status = _classify(entry);
    entry.updatedAt = Date.now();
    state.topics[topic.id] = entry;
    _saveState(state);
    return entry;
  }

  /** Guarda el hueco diagnosticado para un tema. */
  function recordGap(id, gap) {
    if (!id || !gap) return null;
    const state = getState();
    const entry = state.topics[id] || _blankTopic(id);
    entry.gap = {
      concept: String(gap.gap_concept || gap.concept || entry.label || '').slice(0, 120),
      cause: String(gap.root_cause || gap.cause || '').slice(0, 400),
      at: Date.now(),
    };
    entry.status = STATUS.GAP;
    entry.updatedAt = Date.now();
    state.topics[id] = entry;
    _saveState(state);
    return entry;
  }

  /* ── Groq ──────────────────────────────────────────────────────────────── */

  /**
   * ¿Se puede preguntar al modelo?
   *
   * Hay que pasar por `init()`, no por `isConfigured()`: el modo se resuelve
   * la primera vez consultando `/api/health`, y fuera de la página de IA nadie
   * lo hace. Preguntando solo por `isConfigured()` el motor se creía sin Groq
   * en las lecciones y no proponía nada. `init()` cachea su promesa, así que
   * llamarlo en cada intento no cuesta una petición extra.
   */
  async function _groqReady() {
    if (typeof GroqService === 'undefined') return false;
    try {
      return (await GroqService.init()) !== 'none';
    } catch {
      return false;
    }
  }

  /**
   * Extrae el JSON de una respuesta del modelo.
   *
   * Los modelos envuelven el objeto en ```json, lo preceden de una frase o
   * ambas cosas. Pedir "solo JSON" ayuda pero no garantiza nada, así que se
   * busca el primer bloque equilibrado en vez de confiar en el formato.
   */
  function _parseJson(raw) {
    if (!raw) return null;
    const text = String(raw).replace(/```json/gi, '```').replace(/```/g, '').trim();
    try {
      return JSON.parse(text);
    } catch { /* no venía limpio: se busca el objeto dentro */ }

    const start = text.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(text.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }

  /** Mismo canal que usa el chat: quien quiera reflejar el estado, que escuche. */
  function _anunciarEstado(estado) {
    window.dispatchEvent(new CustomEvent('in4mind-ai-state', { detail: { state: estado } }));
  }

  async function _ask(prompt) {
    if (!(await _groqReady())) return null;
    _anunciarEstado('thinking');
    try {
      const reply = await GroqService.chat([{ role: 'user', content: prompt }]);
      _anunciarEstado('success');
      return _parseJson(reply);
    } catch (err) {
      _anunciarEstado('error');
      // Un fallo del asistente no puede estropear la lección que se está
      // leyendo: se anota y el motor sigue en silencio.
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('adaptive_groq_fail', { message: err?.message || String(err) });
      }
      return null;
    }
  }

  /**
   * Pide dos preguntas de comprobación sobre lo que se acaba de estudiar.
   * @returns {Promise<Array<{question:string,options:string[],answer:number,concept:string}>>}
   */
  async function generateQuestions(context) {
    const tema = context.title || context.courseTitle || context.courseId || 'el tema actual';
    const extracto = String(context.text || '').slice(0, 900);

    const prompt = [
      `Genera ${QUESTIONS_PER_QUIZ} preguntas de comprobación sobre "${tema}" del catálogo IN4MIND.`,
      extracto ? `Contexto estudiado:\n"""\n${extracto}\n"""` : '',
      'Responde SOLO con JSON válido, sin texto alrededor, con esta forma exacta:',
      '{"questions":[{"question":"...","options":["...","...","..."],"answer":0,"concept":"..."}]}',
      '- "answer" es el índice (0-based) de la opción correcta.',
      '- "concept" es el concepto concreto que evalúa la pregunta, en dos o tres palabras.',
      '- Tres opciones por pregunta, una sola correcta, sin numerarlas.',
      '- Preguntas breves, de comprensión, no de memorizar definiciones.',
    ].filter(Boolean).join('\n');

    const data = await _ask(prompt);
    const list = Array.isArray(data?.questions) ? data.questions : [];

    return list
      .filter(q => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length >= 2)
      .slice(0, QUESTIONS_PER_QUIZ)
      .map(q => ({
        question: String(q.question).slice(0, 300),
        options: q.options.slice(0, 4).map(o => String(o).slice(0, 200)),
        answer: Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length ? q.answer : 0,
        concept: String(q.concept || tema).slice(0, 120),
      }));
  }

  /**
   * Análisis de causa raíz: qué falta por debajo del fallo, no qué se falló.
   *
   * @returns {Promise<{gap_concept:string, root_cause:string}|null>}
   */
  async function analyseGap({ concept, question, chosen, expected, courseTitle }) {
    const prompt = [
      'Un estudiante de IN4MIND ha fallado esta comprobación.',
      courseTitle ? `Curso: ${courseTitle}` : '',
      `Concepto evaluado: ${concept}`,
      `Pregunta: ${question}`,
      `Respondió: ${chosen}`,
      `Respuesta correcta: ${expected}`,
      '',
      'Identifica la carencia de base que explica el error, no el error en sí.',
      'Responde SOLO con JSON válido, sin texto alrededor:',
      '{"gap_concept":"...","root_cause":"..."}',
      '- "gap_concept": el concepto previo que falta, en dos o tres palabras.',
      '- "root_cause": una frase explicando qué idea se ha entendido mal.',
    ].filter(Boolean).join('\n');

    const data = await _ask(prompt);
    if (!data?.gap_concept && !data?.root_cause) return null;
    return {
      gap_concept: String(data.gap_concept || concept).slice(0, 120),
      root_cause: String(data.root_cause || '').slice(0, 400),
    };
  }

  /**
   * Micro-lección de refuerzo para un hueco concreto.
   *
   * Se pide corta a propósito —unas 150 palabras, menos de un minuto— porque
   * aparece en mitad de otra cosa: si fuera un artículo, nadie lo leería y
   * además rompería el hilo de lo que se estaba estudiando.
   *
   * El resultado se guarda en el propio tema. Volver a abrir el mismo nodo no
   * vuelve a gastar una llamada, y sigue disponible sin conexión.
   *
   * @returns {Promise<string|null>} texto plano, sin marcado
   */
  async function generateMicroLesson(id) {
    const topic = getTopic(id);
    if (!topic) return null;
    if (topic.lesson?.text) return topic.lesson.text;   // ya generada

    const concepto = topic.gap?.concept || topic.label;
    const causa = topic.gap?.cause || '';

    const prompt = [
      `Escribe una micro-lección de refuerzo sobre "${concepto}" para un estudiante de IN4MIND.`,
      causa ? `El error de base detectado es: ${causa}` : '',
      'Requisitos:',
      '- Unas 150 palabras, menos de un minuto de lectura.',
      '- Ataca justo esa carencia, no el temario entero.',
      '- Empieza por la idea clave en una frase, sigue con un ejemplo concreto y cierra con cómo comprobarlo.',
      '- Texto corrido en español, sin markdown, sin listas, sin títulos y sin emojis.',
      'Responde SOLO con JSON válido: {"lesson":"..."}',
    ].filter(Boolean).join('\n');

    const data = await _ask(prompt);
    const texto = typeof data?.lesson === 'string' ? data.lesson.trim() : '';
    if (!texto) return null;

    const state = getState();
    const entry = state.topics[id];
    if (entry) {
      entry.lesson = { text: texto.slice(0, 1500), at: Date.now() };
      entry.updatedAt = Date.now();
      _saveState(state);
    }
    return texto;
  }

  /** Lección ya generada para un tema, si la hay. */
  function getMicroLesson(id) {
    return getTopic(id)?.lesson?.text || null;
  }

  /**
   * Marca el refuerzo como leído.
   *
   * No cierra el hueco: haber leído no es haber entendido. El tema sale de
   * rojo cuando se vuelve a acertar, que es la única señal fiable.
   */
  function markReinforced(id) {
    const state = getState();
    const entry = state.topics[id];
    if (!entry?.gap) return null;
    entry.gap.readAt = Date.now();
    entry.updatedAt = Date.now();
    _saveState(state);
    return entry;
  }

  /* ── Señales ───────────────────────────────────────────────────────────── */

  /**
   * ¿Es buen momento para aparecer?
   *
   * Cada condición responde a una forma concreta de molestar: encadenar
   * quizzes, saltar encima de alguien que está escribiendo, o gastar batería
   * y cuota en una pestaña que nadie está mirando.
   */
  function _goodMoment() {
    if (!isEnabled() || _pending) return false;
    if (_signals < MIN_SIGNALS) return false;
    if (typeof document !== 'undefined' && document.hidden) return false;

    const activo = document.activeElement;
    if (activo && /^(input|textarea|select)$/i.test(activo.tagName)) return false;
    if (activo && activo.isContentEditable) return false;

    const { lastQuizAt } = getState();
    return Date.now() - (lastQuizAt || 0) >= COOLDOWN_MS;
  }

  /** Marca el momento del último quiz para que el enfriamiento cuente. */
  function _stampQuiz() {
    const state = getState();
    state.lastQuizAt = Date.now();
    _saveState(state);
  }

  /**
   * Prepara un micro-quiz para el contexto recibido y lo publica por evento.
   * Si no hay preguntas —sin Groq, o el modelo no devolvió JSON usable— no
   * ocurre nada: el silencio es preferible a una tarjeta vacía.
   */
  async function _offerQuiz(context) {
    _pending = true;
    try {
      const questions = await generateQuestions(context);
      if (!questions.length) return;

      _stampQuiz();
      window.dispatchEvent(new CustomEvent('in4mind-adaptive-quiz', {
        detail: { context, questions },
      }));
    } finally {
      _pending = false;
    }
  }

  /**
   * Punto de entrada de las señales de la app.
   * @param {{source:string, courseId?:string, lessonId?:string, title?:string, text?:string}} detail
   */
  function handleSignal(detail) {
    if (!isEnabled() || !detail) return;
    _signals += 1;
    if (!_goodMoment()) return;
    void _offerQuiz(detail);
  }

  /**
   * Resultado de una pregunta del micro-quiz. Devuelve el tema actualizado y,
   * cuando toca, dispara el diagnóstico en segundo plano.
   */
  async function submitAnswer({ context, question, chosenIndex }) {
    const id = topicId(context?.courseId, question.concept);
    const correct = chosenIndex === question.answer;
    const topic = recordAnswer({
      id,
      label: question.concept,
      courseId: context?.courseId || null,
    }, correct);

    if (correct) return { correct: true, topic, gap: null };

    const gap = await analyseGap({
      concept: question.concept,
      question: question.question,
      chosen: question.options[chosenIndex] ?? '(sin respuesta)',
      expected: question.options[question.answer],
      courseTitle: context?.title || context?.courseId,
    });

    return { correct: false, topic: gap ? recordGap(id, gap) : topic, gap };
  }

  /* ── Arranque ──────────────────────────────────────────────────────────── */

  function init() {
    if (_bound || !isEnabled()) return;
    _bound = true;
    window.addEventListener('in4mind-learning-signal', (e) => handleSignal(e.detail));
  }

  return {
    // Estado
    isEnabled, setEnabled, getState, getTopics, getTopic, topicId,
    // Registro
    recordAnswer, recordGap, submitAnswer,
    // Groq
    generateQuestions, analyseGap, generateMicroLesson, getMicroLesson, markReinforced,
    // Ciclo de vida
    init, handleSignal,
    // Constantes que comparten los componentes y los tests
    STATUS, COOLDOWN_MS, QUESTIONS_PER_QUIZ, FLAG_KEY, STATE_KEY,
    _parseJson,
  };

})();

if (typeof window !== 'undefined') {
  const boot = () => AdaptiveLearningService.init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

if (typeof module !== 'undefined') module.exports = AdaptiveLearningService;
