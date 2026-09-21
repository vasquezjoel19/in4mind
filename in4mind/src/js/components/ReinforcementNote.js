/**
 * IN4MIND — Nota de refuerzo desplegable.
 *
 * Cuando el diagnóstico encuentra un hueco, aquí se ofrece la micro-lección
 * que lo ataca. Aparece plegada, como un aviso discreto bajo la comprobación
 * que se acaba de fallar, y solo se despliega si la persona quiere: leerla es
 * una oferta, no un peaje para seguir.
 *
 * Por eso no es un diálogo modal. Un modal detiene la lección, tapa lo que se
 * estaba leyendo y obliga a decidir; esto se puede ignorar y seguir bajando.
 *
 * El mismo componente lo usa el mapa 3D: al tocar un nodo en rojo se monta
 * esta nota en el panel del gráfico, ya desplegada.
 */

'use strict';

const ReinforcementNote = (() => {

  const CLASS = 'reinforce';

  function _t(key, params, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key, params);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  /**
   * Divide el texto del modelo en párrafos.
   * Se pide sin marcado, pero a veces llega con saltos dobles: se respetan.
   */
  function _parrafos(texto) {
    return String(texto || '')
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);
  }

  /**
   * @param {{topic:object, mount:Element, open?:boolean, onClose?:Function}} opts
   * @returns {Element|null}
   */
  function render({ topic, mount, open = false, onClose } = {}) {
    if (!topic?.id || !mount) return null;

    const concepto = topic.gap?.concept || topic.label || '';

    const nota = document.createElement('section');
    nota.className = CLASS;
    nota.dataset.topic = topic.id;

    /* `details` da el plegado accesible de serie: teclado, lectores de
       pantalla y el estado abierto/cerrado sin una línea de JavaScript. */
    const det = document.createElement('details');
    det.className = 'reinforce__details';
    det.open = !!open;

    const sum = document.createElement('summary');
    sum.className = 'reinforce__summary';

    const etiqueta = document.createElement('span');
    etiqueta.className = 'reinforce__tag';
    etiqueta.textContent = _t('adaptive.reinforceTag', null, 'Refuerzo');

    const titulo = document.createElement('span');
    titulo.className = 'reinforce__title';
    titulo.textContent = concepto;

    sum.append(etiqueta, titulo);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'reinforce__body';

    if (topic.gap?.cause) {
      const causa = document.createElement('p');
      causa.className = 'reinforce__cause';
      causa.textContent = topic.gap.cause;
      cuerpo.appendChild(causa);
    }

    const contenido = document.createElement('div');
    contenido.className = 'reinforce__lesson';
    contenido.setAttribute('aria-live', 'polite');
    cuerpo.appendChild(contenido);

    const acciones = document.createElement('div');
    acciones.className = 'reinforce__actions';

    const listo = document.createElement('button');
    listo.type = 'button';
    listo.className = 'reinforce__btn';
    listo.textContent = _t('adaptive.reinforceDone', null, 'Entendido');
    listo.addEventListener('click', () => {
      try { AdaptiveLearningService.markReinforced(topic.id); } catch { /* estado opcional */ }
      nota.remove();
      onClose?.();
    });

    acciones.appendChild(listo);
    cuerpo.append(acciones);
    det.append(sum, cuerpo);
    nota.appendChild(det);
    mount.appendChild(nota);

    /* La lección se pide al desplegar, no antes: si nadie abre la nota, no se
       gasta una llamada al modelo. */
    let cargando = false;
    const cargar = async () => {
      if (cargando || contenido.dataset.ready === '1') return;
      cargando = true;
      contenido.textContent = _t('adaptive.reinforceLoading', null, 'Preparando el refuerzo…');
      try {
        const texto = await AdaptiveLearningService.generateMicroLesson(topic.id);
        contenido.textContent = '';
        if (!texto) {
          contenido.textContent = _t('adaptive.reinforceUnavailable', null,
            'No se ha podido preparar el refuerzo ahora mismo. Vuelve a intentarlo más tarde.');
          return;
        }
        for (const parrafo of _parrafos(texto)) {
          const p = document.createElement('p');
          p.textContent = parrafo;   // texto del modelo: nunca como HTML
          contenido.appendChild(p);
        }
        contenido.dataset.ready = '1';
      } catch {
        contenido.textContent = _t('adaptive.reinforceUnavailable', null,
          'No se ha podido preparar el refuerzo ahora mismo. Vuelve a intentarlo más tarde.');
      } finally {
        cargando = false;
      }
    };

    det.addEventListener('toggle', () => { if (det.open) void cargar(); });
    if (det.open) void cargar();

    return nota;
  }

  /** Atajo para el mapa 3D: nota ya desplegada para un tema concreto. */
  function showForTopic(id, mount) {
    const topic = AdaptiveLearningService.getTopic(id);
    if (!topic) return null;
    mount.querySelectorAll(`.${CLASS}`).forEach(n => n.remove());
    return render({ topic, mount, open: true });
  }

  function init() {
    window.addEventListener('in4mind-adaptive-gap', (e) => {
      const { topic, card } = e.detail || {};
      if (!topic?.id) return;
      /* Se cuelga de la propia tarjeta del quiz: así la explicación queda
         justo debajo de la pregunta que la motivó. */
      const mount = card?.parentElement;
      if (!mount) return;
      try {
        const nota = render({ topic, mount });
        if (nota && card.nextSibling !== nota) card.insertAdjacentElement('afterend', nota);
      } catch (err) {
        if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('reinforce_render', { message: err?.message || String(err) });
        }
      }
    });
  }

  return { init, render, showForTopic };

})();

if (typeof window !== 'undefined') {
  const boot = () => ReinforcementNote.init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

if (typeof module !== 'undefined') module.exports = ReinforcementNote;
