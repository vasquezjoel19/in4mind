/**
 * IN4MIND — Intérprete de Python en un Web Worker (Pyodide / WebAssembly).
 *
 * Por qué un worker y no el hilo principal: un `while True:` de un alumno
 * bloquearía la pestaña entera —ni siquiera podría pulsar "Reiniciar"—. Aquí,
 * la página sigue respondiendo y basta con `worker.terminate()` para cortarlo.
 *
 * Pyodide son unos 10 MB entre el intérprete y la biblioteca estándar, así que
 * se descarga la primera vez que alguien ejecuta Python y no antes. El worker
 * ni siquiera se crea hasta entonces (ver `CodeSandbox._ejecutarPython`).
 */

'use strict';

const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

let _pyodide = null;
let _cargando = null;

function enviar(mensaje) {
  self.postMessage(mensaje);
}

function salida(texto, nivel) {
  enviar({ tipo: 'salida', nivel: nivel || 'log', texto: String(texto) });
}

/**
 * Carga Pyodide una sola vez.
 *
 * `loadPyodide` se expone en el ámbito global del worker tras `importScripts`,
 * que aquí es síncrono y por eso no hace falta esperarlo aparte.
 */
async function iniciar() {
  if (_pyodide) return _pyodide;
  if (_cargando) return _cargando;

  _cargando = (async () => {
    self.importScripts(`${PYODIDE}pyodide.js`);
    const py = await self.loadPyodide({
      indexURL: PYODIDE,
      // `print()` y los errores del intérprete se reenvían tal cual a la
      // terminal de IN4MIND, en lugar de perderse en la consola del worker.
      stdout: (linea) => salida(linea, 'log'),
      stderr: (linea) => salida(linea, 'error'),
    });
    _pyodide = py;
    return py;
  })();

  return _cargando;
}

/**
 * Deja el traceback en algo que un principiante pueda leer.
 *
 * Pyodide antepone varias líneas de su propio andamiaje ("File
 * <exec>", frames internos) que no tienen nada que ver con el código del
 * alumno y solo despistan.
 */
function limpiarTraza(texto) {
  const lineas = String(texto).split('\n');
  const utiles = lineas.filter((l) => !/pyodide|_pyodide|importlib|<frozen /i.test(l));
  return (utiles.length ? utiles : lineas).join('\n').slice(0, 1500);
}

self.addEventListener('message', async (ev) => {
  const datos = ev.data || {};
  if (datos.tipo !== 'ejecutar') return;

  try {
    const py = await iniciar();

    /* `runPythonAsync` permite `await` en el código del alumno y, sobre todo,
       cede el control entre sentencias: sin eso, ni la salida por `print`
       llegaría hasta el final de la ejecución. */
    await py.runPythonAsync(datos.codigo || '');
    enviar({ tipo: 'fin', ok: true });
  } catch (err) {
    const bruto = (err && err.message) ? err.message : String(err);
    const limpio = limpiarTraza(bruto);
    // La última línea de un traceback es la que nombra el error de verdad.
    const resumen = limpio.trim().split('\n').pop() || limpio;

    enviar({ tipo: 'error', mensaje: resumen, traza: limpio });
    enviar({ tipo: 'fin', ok: false });
  }
});
