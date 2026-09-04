# Integración Groq IA — IN4MIND

Guía paso a paso para activar el asistente con **Groq** en la sección **IA**.

---

## Paso 1 — Obtener API Key de Groq

1. Ingrese a **https://console.groq.com/**
2. Cree una cuenta o inicie sesión
3. Vaya a **API Keys** → **Create API Key**
4. Copie la clave (formato: `gsk_xxxxxxxx…`)

---

## Paso 2 — Colocar la API Key (producción: Vercel)

La clave **no se coloca en el código**. El navegador llama a `/api/groq/chat` y es esa
función serverless la que añade la credencial, de modo que nunca llega al cliente.

En Vercel → **Settings → Environment Variables**, cree para *Production* y *Preview*:

| Variable | Ejemplo | Obligatoria |
|---|---|---|
| `GROQ_API_KEY` | `gsk_xxxxxxxx…` | Sí |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | No |
| `GROQ_MAX_TOKENS` | `1200` | No |
| `GROQ_TEMPERATURE` | `0.45` | No |

Las variables solo se aplican en un despliegue nuevo: tras guardarlas, use
**Deployments → ⋯ → Redeploy**.

Verifique en `https://SU-DOMINIO.vercel.app/api/health` que la respuesta incluya
`"groq": true`.

> **Importante:** nunca escriba la clave en un archivo versionado. `.env` y
> `src/js/config/groq.config.js` están en `.gitignore`; si una clave llega a un repo
> público, GitHub la detecta y Groq la revoca automáticamente.

### Comprobar la clave antes de desplegar

`/api/health` solo mira que la variable **exista**: una clave revocada sigue dando
`"groq": true` y el fallo aparece más tarde, al pedir una respuesta. Para validarla
de verdad:

```bash
npm run check:groq
```

Distingue los tres fallos que se confunden entre sí:

| Salida | Significado |
|---|---|
| `✗ CLAVE INVÁLIDA (401)` | Revocada, borrada o mal copiada → genere una nueva |
| `✗ El modelo … YA NO EXISTE` | Groq retiró el modelo → cambie `GROQ_MODEL` |
| `✓ Clave válida` + `✓ modelo disponible` | La integración debería funcionar |

Lee `GROQ_API_KEY` del entorno y, si no está, `API_KEY` de `groq.config.js`. Nunca
imprime la clave.

### Desarrollo local

- **Con backend (recomendado):** `vercel dev` levanta las funciones de `api/` y lee el
  archivo `.env` de la raíz, igual que en producción.
- **Sin backend** (`npm start`, que sirve archivos estáticos): copie
  `groq.config.example.js` como `groq.config.js` y pegue su clave en `API_KEY`. Solo
  para su máquina — en ese modo la clave sí queda visible en el navegador.

---

## Paso 3 — Ejecutar la aplicación

Desde la carpeta **padre** del proyecto:

```powershell
cd "C:\Users\JoelVasquez\Downloads\in4mind_refactored (1)"
python -m http.server 8080
```

Abra en el navegador:

```
http://localhost:8080/in4mind/ai.html
```

Recargue con **Ctrl + Shift + R** para evitar caché.

---

## Paso 4 — Verificar funcionamiento

### Comprobación rápida por endpoint

| Endpoint | Qué comprueba |
|----------|---------------|
| `/api/health` | Que la variable **esté configurada** (no hace red). Devuelve `"groq": true`, o `"groqReason"` con el motivo: `missing`, `placeholder` o `malformed`. |
| `/api/groq/ping` | Que la clave **funcione de verdad**: hace una llamada mínima (1 token) a Groq. Añade `?fresh=1` para saltarse la caché de 60 s. |

Respuesta esperada de `/api/groq/ping` cuando todo está bien:

```json
{ "ok": true, "configured": true, "model": "llama-3.3-70b-versatile", "latencyMs": 340, "respondedWithChoices": true }
```

Errores que distingue:

| `error` | Causa habitual |
|---------|----------------|
| `GROQ_API_KEY_MISSING` | Variable ausente, vacía, con texto de plantilla o mal formada |
| `GROQ_API_KEY_INVALID` | Clave revocada o incorrecta (401/403) |
| `GROQ_RATE_LIMITED` | Cuota agotada (429) |
| `GROQ_MODEL_NOT_FOUND` | El modelo de `GROQ_MODEL` ya no existe |
| `GROQ_TIMEOUT` / `GROQ_UNREACHABLE` | Groq no respondió en 8 s |

### Comprobación desde la interfaz

| Indicador | Significado |
|-----------|-------------|
| Banner amarillo visible | API Key aún no configurada |
| Estado: **Conectado a Groq IA** | Integración activa |
| Respuestas detalladas con formato | Groq respondiendo correctamente |

Si la key es inválida, el asistente mostrará un mensaje de error profesional indicando revisar la credencial.

---

## Archivos de integración

| Archivo | Función |
|---------|---------|
| `api/groq/chat.js` | **Proxy serverless: única pieza que usa `GROQ_API_KEY`** |
| `api/_lib/groq-env.js` | Lee y valida `GROQ_API_KEY` (única fuente de verdad) |
| `api/health.js` | Informa al frontend si la clave está configurada |
| `api/groq/ping.js` | Prueba de conexión real contra Groq (diagnóstico) |
| `src/js/config/groq.config.js` | Modelo y parámetros (generado en build, sin secretos) |
| `src/js/config/groq.config.example.js` | Plantilla de referencia |
| `src/js/services/GroqService.js` | Cliente: usa el proxy y cae a modo local si no hay backend |
| `src/js/controllers/AIChatController.js` | Interfaz del chat |
| `src/css/ai.css` | Vista profesional tipo Gemini |
| `ai.html` | Página del asistente |

---

## Modelos disponibles (opcional)

Cambie la variable `GROQ_MODEL` en Vercel:

| Modelo | Uso |
|--------|-----|
| `llama-3.3-70b-versatile` | Recomendado — respuestas completas |
| `llama-3.1-8b-instant` | Más rápido, respuestas más breves |

El proxy solo acepta modelos de esa lista (`ALLOWED_MODELS` en `api/groq/chat.js`);
cualquier otro valor enviado desde el navegador se ignora y usa el predeterminado.

---

## Modo sin API Key (fallback)

Si no configura la key, el chat usa respuestas locales (`AIKnowledge.js`) con contenido básico de IN4MIND. Para la experiencia completa con IA generativa, configure Groq.

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| No veo cambios | Ctrl + Shift + R; URL debe incluir `/in4mind/` |
| Error 401/403 | API Key incorrecta o revocada |
| CORS / red | Verifique conexión a internet |
| Respuestas informales | El system prompt fuerza tono profesional; recargue la página |

---

## Punto de integración en código

El navegador nunca ve la credencial:

```
ai.html / help.html
  → GroqService.chatStream()        (src/js/services/GroqService.js)
    → POST /api/groq/chat           (sin Authorization)
      → api/groq/chat.js            añade Bearer ${process.env.GROQ_API_KEY}
        → api.groq.com              respuesta SSE reenviada tal cual
```

`GroqService.init()` consulta `/api/health` una sola vez para decidir el modo:
**proxy** si el backend tiene la clave, **directo** si solo hay una clave local de
desarrollo, y **local** (`AIKnowledge.js`) si no hay ninguna.
