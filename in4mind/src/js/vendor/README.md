# Three.js vendorizado

`three@0.186.0`, builds minificados oficiales descargados de jsDelivr.

## Por qué está aquí y no en un CDN

Mismo criterio que con los iconos: una dependencia de terceros en tiempo de
ejecución significa que una caída suya rompe la página, y que cada visita
informa a un servidor ajeno. Servido desde el propio dominio, además, la CSP lo
cubre con `script-src 'self'` sin necesidad de SRI, que en un `import()`
dinámico no se puede aplicar.

## Nombres de fichero

Son los builds `.min.js` de jsDelivr, pero guardados sin el sufijo `.min`:
`three.module.js` importa `./three.core.js` con esa ruta exacta, así que
renombrarlos rompería la carga. El contenido sí está minificado.

## Actualizar

    curl -L https://cdn.jsdelivr.net/npm/three@<version>/build/three.module.min.js -o three.module.js
    curl -L https://cdn.jsdelivr.net/npm/three@<version>/build/three.core.min.js   -o three.core.js

Solo lo carga `NeuralBackground.js`, y únicamente cuando el fondo va a
dibujarse de verdad (ver las condiciones en ese fichero).
