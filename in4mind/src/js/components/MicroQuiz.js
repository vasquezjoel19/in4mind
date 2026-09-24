/**
 * IN4MIND — Tarjeta de micro-quiz en línea.
 *
 * Dibuja las dos preguntas que propone `AdaptiveLearningService` dentro del
 * propio hilo que la persona está leyendo: al final de la conversación en la
 * página de IA, o debajo del artículo en una lección.
 *
 * Reglas de la casa para que no moleste:
 *  - No roba el foco ni bloquea el desplazamiento; se puede ignorar y seguir.
 *  - Se cierra con un botón y no vuelve a insistir con el mismo contenido.
 *  - Nunca hay dos tarjetas a la vez.
 *
 * Todo el texto del modelo entra con `textContent`. Es contenido generado y
 * llega por red: interpolarlo en `innerHTML` sería un hueco de inyección en la
 * propia página de la lección.
 */

'use strict';

const MicroQuiz = (() => {

  const CARD_CLASS = 'micro-quiz';
  let _card = null;

  function _t(key, params, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key, params);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  /**
   * Dónde colocar la tarjeta.
   *
   * El orden importa: `[data-adaptive-slot]` permite que cualquier página
   * decida el sitio sin tocar este archivo; si no lo hay, se usan los dos
   * contenedores donde el motor tiene sentido hoy.
   */
  function _mountPoint() {
    const explicito = document.querySelector('[data-adaptive-slot]');
    if (explicito) return { host: explicito, mode: 'append' };

    const hilo = document.getElementById('chat-thread');
    if (hilo && hilo.offsetParent !== null) return { host: hilo, mode: 'append' };

    const articulo = document.getElementById('lesson-article');
    if (articulo && articulo.offsetParent !== null) return { host: articulo, mode: 'after' };

    return null;
  }

  function _boton(texto, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'micro-quiz__option';
    b.textContent = texto;
    b.addEventListener('click', onClick);
    return b;
  }

  function close() {
    if (!_card) return;
    try { _card.remove(); } catch { /* ya no estaba en el árbol */ }
    _card = null;
  }

  /**
   * @param {{context:object, questions:Array}} detail
   */
  function render(detail) {
    const questions = Array.isArray(detail?.questions) ? detail.questions : [];
    if (!questions.length) return;

    const punto = _mountPoint();
    if (!punto) return;   // la página no tiene dónde ponerla: mejor callarse

    close();

    const card = document.createElement('aside');
    card.className = CARD_CLASS;
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', _t('adaptive.quizAria', null, 'Comprobación rápida'));

    const head = document.createElement('div');
    head.className = 'micro-quiz__head';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'micro-quiz__eyebrow';
    eyebrow.textContent = _t('adaptive.quizEyebrow', null, 'Comprobación rápida');

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'micro-quiz__close';
    cerrar.setAttribute('aria-label', _t('common.close', null, 'Cerrar'));
    cerrar.textContent = '×';
    cerrar.addEventListener('click', close);

    head.append(eyebrow, cerrar);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'micro-quiz__body';

    const progreso = document.createElement('p');
    progreso.className = 'micro-quiz__progress';

    const pregunta = document.createElement('p');
    pregunta.className = 'micro-quiz__question';

    const opciones = document.createElement('div');
    opciones.className = 'micro-quiz__options';

    const aviso = document.createElement('p');
    aviso.className = 'micro-quiz__feedback';
    aviso.setAttribute('aria-live', 'polite');

    cuerpo.append(progreso, pregunta, opciones, aviso);
    card.append(head, cuerpo);

    let idx = 0;
    let aciertos = 0;

    const pintar = () => {
      const q = questions[idx];
      progreso.textContent = _t('adaptive.quizProgress', { n: idx + 1, total: questions.length },
        `Pregunta ${idx + 1} de ${questions.length}`);
      pregunta.textContent = q.question;
      aviso.textContent = '';
      opciones.textContent = '';

      q.options.forEach((opcion, i) => {
        opciones.append(_boton(opcion, async (ev) => {
          // Se bloquean las opciones en cuanto hay respuesta, para que un
          // doble clic no cuente dos veces.
          [...opciones.children].forEach(b => { b.disabled = true; });
          const acierto = i === q.answer;
          ev.currentTarget.classList.add(acierto ? 'is-right' : 'is-wrong');
          if (!acierto) {
            const buena = opciones.children[q.answer];
            if (buena) buena.classList.add('is-right');
          }
          if (acierto) aciertos += 1;

          aviso.textContent = acierto
            ? _t('adaptive.quizRight', null, 'Correcto.')
            : _t('adaptive.quizWrong', null, 'No era esa. Buscando qué reforzar…');

          let resultado = null;
          try {
            resultado = await AdaptiveLearningService.submitAnswer({
              context: detail.context,
              question: q,
              chosenIndex: i,
            });
          } catch { /* el motor ya registra sus propios fallos */ }

          if (resultado?.gap) {
            aviso.textContent = _t('adaptive.quizGap', { concept: resultado.gap.gap_concept },
              `Repasemos ${resultado.gap.gap_concept}.`);
            window.dispatchEvent(new CustomEvent('in4mind-adaptive-gap', {
              detail: { gap: resultado.gap, topic: resultado.topic, context: detail.context, card },
            }));
          }

          idx += 1;
          if (idx < questions.length) {
            setTimeout(pintar, acierto ? 900 : 1800);
          } else {
            setTimeout(() => cerrarConResumen(aciertos, questions.length), acierto ? 900 : 1800);
          }
        }));
      });
    };

    const cerrarConResumen = (bien, total) => {
      if (!_card) return;
      progreso.textContent = '';
      pregunta.textContent = _t('adaptive.quizDone', { n: bien, total },
        `${bien} de ${total} correctas.`);
      opciones.textContent = '';
      aviso.textContent = '';
      card.classList.add('is-done');
    };

    if (punto.mode === 'after') punto.host.insertAdjacentElement('afterend', card);
    else punto.host.appendChild(card);

    _card = card;
    pintar();
  }

  function init() {
    window.addEventListener('in4mind-adaptive-quiz', (e) => {
      try {
        render(e.detail);
      } catch (err) {
        // Un fallo dibujando no puede tumbar la lección: se anota y se retira.
        if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('micro_quiz_render', { message: err?.message || String(err) });
        }
        close();
      }
    });
  }

  return { init, render, close };

})();

if (typeof window !== 'undefined') {
  const boot = () => MicroQuiz.init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

if (typeof module !== 'undefined') module.exports = MicroQuiz;
