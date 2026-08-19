/**
 * IN4MIND — Downloadable starter kits for Ruta Empleable tracks.
 * Generates client-side ZIP (store) or single-file downloads — no CDN deps.
 */
'use strict';

const EmployabilityStarters = (() => {

  function _u8(str) {
    return new TextEncoder().encode(String(str));
  }

  function _crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  }

  function _u16(n) {
    return new Uint8Array([n & 255, (n >>> 8) & 255]);
  }

  function _u32(n) {
    return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
  }

  function _concat(parts) {
    const len = parts.reduce((a, p) => a + p.length, 0);
    const out = new Uint8Array(len);
    let o = 0;
    parts.forEach((p) => { out.set(p, o); o += p.length; });
    return out;
  }

  /** Minimal ZIP (STORE / no compression). */
  function buildZip(files) {
    const locals = [];
    const centrals = [];
    let offset = 0;
    files.forEach((f) => {
      const name = _u8(f.name);
      const data = typeof f.content === 'string' ? _u8(f.content) : f.content;
      const crc = _crc32(data);
      const local = _concat([
        _u8('PK\x03\x04'), _u16(20), _u16(0), _u16(0), _u16(0), _u16(0),
        _u32(crc), _u32(data.length), _u32(data.length), _u16(name.length), _u16(0),
        name, data,
      ]);
      const central = _concat([
        _u8('PK\x01\x02'), _u16(20), _u16(20), _u16(0), _u16(0), _u16(0), _u16(0),
        _u32(crc), _u32(data.length), _u32(data.length), _u16(name.length),
        _u16(0), _u16(0), _u16(0), _u16(0), _u32(0), _u32(offset),
        name,
      ]);
      locals.push(local);
      centrals.push(central);
      offset += local.length;
    });
    const centralDir = _concat(centrals);
    const end = _concat([
      _u8('PK\x05\x06'), _u16(0), _u16(0), _u16(files.length), _u16(files.length),
      _u32(centralDir.length), _u32(offset), _u16(0),
    ]);
    return _concat([...locals, centralDir, end]);
  }

  function _downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function _downloadBytes(filename, bytes, mime) {
    _downloadBlob(filename, new Blob([bytes], { type: mime || 'application/octet-stream' }));
  }

  function _webFiles() {
    return [
      {
        name: 'README.md',
        content: `# Web Junior Starter — IN4MIND

## Estructura
- index.html
- styles.css
- script.js

## Entrega
1. Personaliza el contenido
2. Sube a GitHub
3. Publica con Pages / Vercel / Netlify
4. Pega la URL en Ruta Empleable
`,
      },
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi proyecto Web Junior — IN4MIND</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="hero">
    <p class="eyebrow">IN4MIND · Web Junior</p>
    <h1>Tu landing de proyecto</h1>
    <p>Describe en una frase qué problema resuelves.</p>
    <a class="cta" href="#demo">Ver demo</a>
  </header>
  <main id="demo">
    <section>
      <h2>Características</h2>
      <ul>
        <li>HTML semántico</li>
        <li>CSS responsive</li>
        <li>Interacción con JavaScript</li>
      </ul>
    </section>
  </main>
  <footer>
    <p>Hecho con IN4MIND Ruta Empleable</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>
`,
      },
      {
        name: 'styles.css',
        content: `:root {
  --bg: #0f172a;
  --card: #1e293b;
  --accent: #0d9488;
  --text: #f8fafc;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
}
.hero { padding: 3rem 1.25rem; text-align: center; }
.eyebrow { color: var(--accent); letter-spacing: 0.06em; text-transform: uppercase; font-size: 0.8rem; }
.cta {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  background: var(--accent);
  color: white;
  text-decoration: none;
  font-weight: 700;
}
main { max-width: 720px; margin: 0 auto; padding: 1.5rem; }
section { background: var(--card); padding: 1.25rem; border-radius: 12px; }
footer { text-align: center; padding: 2rem; opacity: 0.7; font-size: 0.9rem; }
@media (max-width: 640px) {
  .hero { padding: 2rem 1rem; }
}
`,
      },
      {
        name: 'script.js',
        content: `document.querySelectorAll('.cta').forEach((btn) => {
  btn.addEventListener('click', () => {
    console.log('IN4MIND Web Junior — CTA click');
  });
});
`,
      },
    ];
  }

  function _pythonFiles() {
    return [
      {
        name: 'README.md',
        content: `# Python Junior Starter — IN4MIND

## Archivos
- main.py — script de automatización / datos
- notebook_stub.py — funciones listas para Jupyter

## Entrega
Sube el repo o un Gist / Colab público y pega la URL en Ruta Empleable.
`,
      },
      {
        name: 'main.py',
        content: `"""IN4MIND — Python Junior starter
Automatización y manipulación básica de datos.
"""
from __future__ import annotations

import csv
from pathlib import Path


def load_rows(path: str) -> list[dict]:
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def summarize(rows: list[dict], key: str) -> dict[str, int]:
    out: dict[str, int] = {}
    for row in rows:
        value = (row.get(key) or 'unknown').strip() or 'unknown'
        out[value] = out.get(value, 0) + 1
    return out


def main() -> None:
    sample = Path(__file__).with_name('sample_data.csv')
    if not sample.exists():
        sample.write_text('category,amount\\nalpha,10\\nbeta,20\\nalpha,5\\n', encoding='utf-8')
    rows = load_rows(str(sample))
    print('Filas:', len(rows))
    print('Resumen por category:', summarize(rows, 'category'))


if __name__ == '__main__':
    main()
`,
      },
      {
        name: 'notebook_stub.py',
        content: `# IN4MIND Python Junior — celdas tipo Jupyter
# Copia cada bloque a una celda de Colab / Jupyter

# %% setup
import pandas as pd

# %% load
# df = pd.read_csv("sample_data.csv")
# df.head()

# %% transform
# df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
# summary = df.groupby("category")["amount"].sum()
# summary

# %% export
# summary.to_csv("summary_out.csv")
# print("Listo — exporta summary_out.csv o publica el notebook")
`,
      },
      {
        name: 'sample_data.csv',
        content: `category,amount
alpha,10
beta,20
alpha,5
gamma,12
beta,8
`,
      },
    ];
  }

  function _dataFiles() {
    return [
      {
        name: 'README.md',
        content: `# Analista de datos Jr — Starter IN4MIND

## Contenido
- sales_sample.csv — dataset stub
- dashboard_guide.md — guía para Power BI / Excel

## Entrega
Publica un dashboard (Power BI / Looker / Excel Online) con al menos 3 visuals + 1 filtro.
`,
      },
      {
        name: 'sales_sample.csv',
        content: `date,region,product,units,revenue
2026-01-05,Norte,Alpha,12,480
2026-01-06,Sur,Beta,8,320
2026-01-07,Norte,Beta,15,600
2026-01-08,Este,Alpha,10,400
2026-01-09,Sur,Gamma,6,270
2026-01-10,Oeste,Alpha,9,360
2026-01-11,Norte,Gamma,11,495
2026-01-12,Este,Beta,7,280
`,
      },
      {
        name: 'dashboard_guide.md',
        content: `# Guía rápida dashboard

1. Importa \`sales_sample.csv\` en Power BI o Excel.
2. Crea 3 visuales: barras por región, línea de revenue, tarjeta de total.
3. Añade un filtro/slicer de producto.
4. Publica vista pública y pega el enlace en Ruta Empleable.

Narrativa sugerida: ¿qué región vende más y qué acción tomaría un junior analyst?
`,
      },
    ];
  }

  function _officeFiles() {
    return [
      {
        name: 'README.md',
        content: `# Office 365 & Automatización — Starter IN4MIND

Usa esta guía para documentar tu app Power Apps / flujo / SharePoint.
`,
      },
      {
        name: 'SCHEMA_GUIDE.md',
        content: `# Schema & caso de uso

## Problema de negocio
Describe el proceso manual que automatizas (1–3 oraciones).

## Entidades / listas
| Nombre | Campos clave | Fuente |
|--------|--------------|--------|
| Solicitudes | Id, Solicitante, Estado, Fecha | SharePoint / Dataverse |

## Flujo (punta a punta)
1. Usuario envía formulario
2. Se crea registro
3. Notificación / aprobación
4. Estado visible en tablero

## Acceso para revisión
- Enlace compartible:
- Permiso: Lectura
- Pasos de prueba (3 bullets):

## Checklist IN4MIND
- [ ] App / flujo funcional
- [ ] Instrucciones de acceso
- [ ] Caso de uso documentado
- [ ] Link compartible
`,
      },
    ];
  }

  function _cyberFiles() {
    return [
      {
        name: 'README.md',
        content: `# Ciberseguridad Inicial — Starter IN4MIND

Entrega un informe / checklist de auditoría básico (Markdown o Notion público).
`,
      },
      {
        name: 'security_audit_checklist.md',
        content: `# Checklist de auditoría básica

## Alcance
Sistemas / cuentas revisadas:

## Controles
- [ ] Contraseñas únicas + gestor
- [ ] MFA en cuentas críticas
- [ ] Revisión de phishing (ejemplos)
- [ ] Actualizaciones / backups
- [ ] Principio de mínimo privilegio

## Hallazgos
| Severidad | Hallazgo | Recomendación |
|-----------|----------|---------------|
| Alta | | |
| Media | | |
| Baja | | |

## Plan 30 días
1.
2.
3.
`,
      },
    ];
  }

  const KITS = {
    'web-junior': { zip: 'in4mind-web-junior-starter.zip', files: _webFiles },
    'python-junior': { zip: 'in4mind-python-junior-starter.zip', files: _pythonFiles },
    'data-analyst-jr': { zip: 'in4mind-data-analyst-starter.zip', files: _dataFiles },
    'office365-automation': { zip: 'in4mind-office365-starter.zip', files: _officeFiles },
    'cyber-inicial': { zip: 'in4mind-cyber-inicial-starter.zip', files: _cyberFiles },
  };

  function hasStarter(pathId) {
    return Boolean(KITS[pathId]);
  }

  function downloadStarter(pathId) {
    const kit = KITS[pathId];
    if (!kit) return false;
    const files = kit.files();
    const bytes = buildZip(files);
    _downloadBytes(kit.zip, bytes, 'application/zip');
    return true;
  }

  return { hasStarter, downloadStarter, buildZip };
})();

if (typeof module !== 'undefined') module.exports = EmployabilityStarters;
