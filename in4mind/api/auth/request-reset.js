/**
 * Vercel Serverless — envío real del correo de recuperación de contraseña.
 *
 * El navegador no puede enviar correo por sí solo, así que el cliente llama a
 * este endpoint con la dirección que escribió el usuario y aquí se envía el
 * mensaje a esa dirección concreta.
 *
 * Proveedor: Resend (https://resend.com). Variables de entorno necesarias:
 *   RESEND_API_KEY   — clave de API
 *   RESET_FROM_EMAIL — remitente verificado, p. ej. "IN4MIND <no-reply@tu-dominio.com>"
 *
 * Si no están configuradas responde 503 con RESET_EMAIL_NOT_CONFIGURED para que
 * el cliente lo diga con claridad en vez de fingir que envió algo.
 */
'use strict';

const RESEND_URL = 'https://api.resend.com/emails';
const TOKEN_TTL_MIN = 30;

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/;

function buildHtml({ resetUrl, minutes }) {
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f4f7fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b273c">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:32px;border:1px solid #e2e8f0">
    <p style="letter-spacing:.18em;font-size:12px;color:#4a76b2;margin:0 0 8px">IN4MIND</p>
    <h1 style="font-size:20px;margin:0 0 16px">Recupera tu contraseña</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta.
      Pulsa el botón para crear una nueva. El enlace caduca en ${minutes} minutos.
    </p>
    <p style="margin:0 0 24px">
      <a href="${resetUrl}" style="display:inline-block;background:#3d6499;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">
        Restablecer contraseña
      </a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0">
      Si no fuiste tú, puedes ignorar este correo: tu contraseña no cambiará.
    </p>
  </div>
</body></html>`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'INVALID_JSON' });
    }
  }

  const email = String(body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'INVALID_EMAIL' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESET_FROM_EMAIL;
  if (!apiKey || !from) {
    return res.status(503).json({ error: 'RESET_EMAIL_NOT_CONFIGURED' });
  }

  // El token viaja en el enlace; el cliente lo valida contra el que guardó.
  const token = String(body?.token || '').slice(0, 64);
  if (!token) {
    return res.status(400).json({ error: 'MISSING_TOKEN' });
  }

  // La URL base se toma del propio despliegue, nunca de la petición del cliente,
  // para no permitir que alguien redirija el enlace a un dominio ajeno.
  const host = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.PUBLIC_BASE_URL || '');
  if (!host) {
    return res.status(503).json({ error: 'BASE_URL_NOT_CONFIGURED' });
  }

  const resetUrl = `${host}/login.html?view=reset&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  try {
    const sendRes = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'IN4MIND — Recupera tu contraseña',
        html: buildHtml({ resetUrl, minutes: TOKEN_TTL_MIN }),
      }),
    });

    if (!sendRes.ok) {
      const detail = await sendRes.text().catch(() => '');
      return res.status(502).json({ error: 'SEND_FAILED', detail: detail.slice(0, 300) });
    }

    return res.status(200).json({ ok: true, email });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'RESET_MAIL_ERROR' });
  }
};
