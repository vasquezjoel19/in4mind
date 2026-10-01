/**
 * IN4MIND — Glosario de términos técnicos.
 *
 * Definiciones cortas, de una frase, para resolver la duda sin sacar al alumno
 * de la lección. Si hiciera falta un párrafo, el sitio de eso es la lección,
 * no un globo flotante.
 *
 * Las claves van en minúsculas y sin acentos: el detector normaliza el texto
 * antes de comparar, así que `API`, `api` y `Api` encuentran la misma entrada.
 */

'use strict';

const GlossaryTerms = (() => {

  const TERMINOS = {
    // ── Web ────────────────────────────────────────────────────────────────
    'dom': 'El árbol de objetos que el navegador construye a partir del HTML y que el JavaScript puede leer y modificar.',
    'api': 'Un conjunto de funciones o rutas que un programa ofrece para que otros lo usen sin saber cómo está hecho por dentro.',
    'endpoint': 'Una dirección concreta de una API a la que se le pide o se le envía algo.',
    'json': 'Un formato de texto para intercambiar datos, basado en pares de clave y valor.',
    'http': 'El protocolo con el que el navegador pide páginas y datos a un servidor.',
    'semantica': 'Elegir cada etiqueta por lo que significa y no por cómo se ve, para que buscadores y lectores de pantalla la entiendan.',
    'accesibilidad': 'Diseñar para que la página se pueda usar también sin ver la pantalla, sin ratón o con poca visión.',
    'aria': 'Un conjunto de atributos que explican a los lectores de pantalla lo que un elemento es o hace.',
    'responsive': 'Que la interfaz se adapta al ancho de la pantalla en lugar de tener una versión por dispositivo.',
    'viewport': 'La parte de la página que cabe en la pantalla en este momento.',
    'seo': 'El conjunto de prácticas que ayudan a que un buscador entienda y muestre mejor una página.',

    // ── CSS ────────────────────────────────────────────────────────────────
    'flexbox': 'Un modelo de CSS para repartir elementos en una sola dirección, en fila o en columna.',
    'grid': 'Un modelo de CSS para colocar elementos en filas y columnas a la vez.',
    'box model': 'La idea de que cada elemento es una caja con contenido, relleno, borde y margen.',
    'cascada': 'La regla por la que, cuando varios estilos chocan, gana el más específico y, a igualdad, el último.',
    'especificidad': 'El peso de un selector, que decide qué regla gana cuando dos afectan al mismo elemento.',
    'pseudoclase': 'Un selector que apunta a un estado del elemento, como estar encima con el ratón o tener el foco.',

    // ── Programación ───────────────────────────────────────────────────────
    'variable': 'Un nombre que guarda un valor para poder usarlo y cambiarlo después.',
    'scope': 'La zona del código donde una variable existe y se puede usar.',
    'funcion': 'Un bloque de código con nombre que se puede ejecutar cuando haga falta y devolver un resultado.',
    'parametro': 'El dato que una función espera recibir cuando se la llama.',
    'return': 'La instrucción que termina una función y entrega su resultado a quien la llamó.',
    'bucle': 'Una estructura que repite un bloque de código mientras se cumpla una condición.',
    'condicional': 'Una estructura que ejecuta un bloque sólo si se cumple cierta condición.',
    'array': 'Una lista ordenada de valores a la que se accede por posición.',
    'objeto': 'Una estructura que agrupa valores bajo nombres, en vez de por posición.',
    'diccionario': 'En Python, una estructura que guarda valores asociados a claves.',
    'asincronia': 'Trabajar sin quedarse esperando: se pide algo y se sigue, y la respuesta llega después.',
    'promesa': 'Un objeto que representa un resultado que todavía no está, y que llegará o fallará.',
    'await': 'Dentro de una función async, espera a que una promesa termine y devuelve su valor.',
    'callback': 'Una función que se pasa a otra para que la llame cuando corresponda.',
    'depuracion': 'Buscar y corregir el motivo por el que un programa no hace lo que se esperaba.',
    'excepcion': 'Un error que interrumpe la ejecución y que el código puede capturar para reaccionar.',

    // ── Datos ──────────────────────────────────────────────────────────────
    'sql': 'El lenguaje con el que se consultan y modifican los datos de una base relacional.',
    'join': 'Combinar filas de dos tablas relacionadas para verlas juntas en un resultado.',
    'indice': 'Una estructura que acelera las búsquedas de una columna, a costa de ocupar espacio.',
    'consulta': 'La instrucción con la que se le pide información a una base de datos.',
    'clave primaria': 'La columna que identifica de forma única cada fila de una tabla.',
    'cte': 'Una consulta auxiliar con nombre, declarada con WITH, que hace legible una consulta compleja.',

    // ── Herramientas y seguridad ───────────────────────────────────────────
    'repositorio': 'La carpeta de un proyecto junto con todo su historial de cambios.',
    'commit': 'Un cambio guardado en el historial, con su mensaje explicando qué se hizo.',
    'rama': 'Una línea de trabajo paralela que permite cambiar cosas sin tocar la principal.',
    'merge': 'Incorporar los cambios de una rama en otra.',
    'pull request': 'La propuesta de llevar los cambios de una rama a otra, abierta a revisión.',
    'ci': 'La práctica de ejecutar pruebas automáticas en cada cambio, antes de integrarlo.',
    'phishing': 'Un engaño que se hace pasar por alguien de confianza para que entregues datos o credenciales.',
    'mfa': 'Pedir una segunda prueba además de la contraseña, para que robarla no baste.',
    'ransomware': 'Un programa dañino que cifra los archivos y pide un pago para devolverlos.',
    'malware': 'Cualquier programa creado para dañar un sistema o robar información.',
  };

  function get(termino) {
    return TERMINOS[termino] || null;
  }

  /** Términos ordenados del más largo al más corto. */
  function claves() {
    return Object.keys(TERMINOS).sort((a, b) => b.length - a.length);
  }

  return { get, claves };

})();

if (typeof module !== 'undefined') module.exports = GlossaryTerms;
