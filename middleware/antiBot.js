const rateLimit = require('express-rate-limit');
const axios = require('axios');

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MIN_SUBMIT_MS = 3000;

// Honeypot field name must match the hidden input rendered on the frontend
// (see hdp-frontend/src/utils/useBotProtection.ts).
const HONEYPOT_FIELD_NAME = 'company';

// Limits repeated submissions from the same IP on public inquiry/booking endpoints.
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.' },
});

// Rejects submissions that filled the honeypot field or were submitted faster
// than a human reasonably could. Defense-in-depth for the equivalent client-side check.
const honeypotGuard = (req, res, next) => {
  const honeypotValue = req.body?.[HONEYPOT_FIELD_NAME];
  if (typeof honeypotValue === 'string' && honeypotValue.trim().length > 0) {
    return res.status(400).json({ msg: 'Solicitud inválida' });
  }

  const formLoadedAt = Number(req.body?.formLoadedAt);
  if (Number.isFinite(formLoadedAt) && Date.now() - formLoadedAt < MIN_SUBMIT_MS) {
    return res.status(400).json({ msg: 'Solicitud inválida' });
  }

  next();
};

// Verifies the Cloudflare Turnstile token with Cloudflare's siteverify API.
// If TURNSTILE_SECRET_KEY is not configured, verification is skipped (dev mode).
const turnstileGuard = async (req, res, next) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return next();

  const token = req.body?.turnstileToken;
  if (!token) {
    return res.status(400).json({ msg: 'Verificación anti-bot requerida' });
  }

  try {
    const { data } = await axios.post(
      TURNSTILE_VERIFY_URL,
      new URLSearchParams({ secret, response: token, remoteip: req.ip }),
    );

    if (!data.success) {
      return res.status(400).json({ msg: 'Verificación anti-bot fallida' });
    }

    next();
  } catch (err) {
    console.error('Turnstile verification error:', err.message);
    res.status(503).json({ msg: 'No se pudo verificar la solicitud. Intenta de nuevo.' });
  }
};

module.exports = { publicFormLimiter, honeypotGuard, turnstileGuard };
