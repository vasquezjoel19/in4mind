# Integración Groq IA — IN4MIND

Guía paso a paso para activar el asistente con **Groq** en la sección **IA**.

---

## Paso 1 — Obtener API Key de Groq

1. Ingrese a **https://console.groq.com/**
2. Cree una cuenta o inicie sesión
3. Vaya a **API Keys** → **Create API Key**
4. Copie la clave (formato: `gsk_xxxxxxxx…`)

---

## Paso 2 — Colocar la API Key en el proyecto

Abra el archivo:

```
in4mind/src/js/config/groq.config.js
```

Reemplace la línea:

```javascript
API_KEY: 'gsk_PEGAR_TU_API_KEY_AQUI',
```

Por su clave real:

```javascript
API_KEY: 'gsk_suClaveRealAqui',
```

Guarde el archivo.

> **Importante:** No comparta ni suba esta clave a repositorios públicos. Para producción, use un backend que oculte la key.

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
| `src/js/config/groq.config.js` | **API Key y modelo Groq** |
| `src/js/config/groq.config.example.js` | Plantilla de referencia |
| `src/js/services/GroqService.js` | Cliente HTTP hacia Groq |
| `src/js/controllers/AIChatController.js` | Interfaz del chat |
| `src/css/ai.css` | Vista profesional tipo Gemini |
| `ai.html` | Página del asistente |

---

## Modelos disponibles (opcional)

En `groq.config.js` puede cambiar `MODEL`:

| Modelo | Uso |
|--------|-----|
| `llama-3.3-70b-versatile` | Recomendado — respuestas completas |
| `llama-3.1-8b-instant` | Más rápido, respuestas más breves |
| `mixtral-8x7b-32768` | Contexto amplio |

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

La llamada a Groq ocurre en:

```javascript
// src/js/services/GroqService.js → función chat()
fetch(GroqConfig.API_URL, {
  headers: { Authorization: `Bearer ${GroqConfig.API_KEY}` },
  ...
});
```

La key **solo** se define en `groq.config.js`.
