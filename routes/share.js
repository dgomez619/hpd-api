const express = require('express');
const mongoose = require('mongoose');
const Property = require('../models/Property');

const router = express.Router();

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://hpdvnz.netlify.app').replace(/\/$/, '');
const BACKEND_URL = (process.env.BACKEND_URL || 'https://hpd-api-49j5.onrender.com').replace(/\/$/, '');
const DEFAULT_IMAGE_URL = process.env.SHARE_DEFAULT_IMAGE_URL || `${FRONTEND_URL}/logo.png`;
const DEFAULT_DESCRIPTION = process.env.SHARE_DEFAULT_DESCRIPTION || 'Hospedaje Por Dias ofrece alojamientos completamente equipados y gestionados con atencion personalizada para una estadia segura y confortable en Venezuela.';
const SITE_NAME = process.env.SHARE_SITE_NAME || 'Hospedaje Por Dias';

const escapeHtml = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const stripTags = (value = '') => value.replace(/<[^>]*>/g, ' ');

const normalizeWhitespace = (value = '') => stripTags(value).replace(/\s+/g, ' ').trim();

const summarize = (value, maxLength = 180) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return DEFAULT_DESCRIPTION;
  if (normalized.length <= maxLength) return normalized;

  const truncated = normalized.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${(lastSpace > 120 ? truncated.slice(0, lastSpace) : truncated).trim()}...`;
};

const buildPropertyPageUrl = (propertyId) => `${FRONTEND_URL}/property/${encodeURIComponent(propertyId)}`;
const buildSharePageUrl = (propertyId) => `${BACKEND_URL}/share/property/${encodeURIComponent(propertyId)}`;

const renderShareDocument = ({ title, description, imageUrl, canonicalUrl, shareUrl, statusCode = 200 }) => {
  const safeTitle = escapeHtml(title || SITE_NAME);
  const safeDescription = escapeHtml(description || DEFAULT_DESCRIPTION);
  const safeImageUrl = escapeHtml(imageUrl || DEFAULT_IMAGE_URL);
  const safeCanonicalUrl = escapeHtml(canonicalUrl || FRONTEND_URL);
  const safeShareUrl = escapeHtml(shareUrl || BACKEND_URL);

  return {
    statusCode,
    html: `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}" />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href="${safeCanonicalUrl}" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:locale" content="es_VE" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:url" content="${safeCanonicalUrl}" />
  <meta property="og:image" content="${safeImageUrl}" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${safeImageUrl}" />
  <meta name="twitter:image:alt" content="${safeTitle}" />
  <meta http-equiv="refresh" content="1; url=${safeCanonicalUrl}" />
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #111114;
      color: #f8fafc;
      font-family: Georgia, serif;
      text-align: center;
      padding: 24px;
    }

    main {
      max-width: 36rem;
    }

    a {
      color: #f8fafc;
    }

    p {
      color: rgba(248, 250, 252, 0.75);
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <main>
    <h1>${safeTitle}</h1>
    <p>${safeDescription}</p>
    <p>Si no eres redirigido automaticamente, abre la propiedad aqui:</p>
    <p><a href="${safeCanonicalUrl}" rel="noopener noreferrer">${safeCanonicalUrl}</a></p>
    <p>URL de vista previa compartida: ${safeShareUrl}</p>
  </main>
</body>
</html>`
  };
};

router.get('/property/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const fallback = renderShareDocument({
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      imageUrl: DEFAULT_IMAGE_URL,
      canonicalUrl: FRONTEND_URL,
      shareUrl: buildSharePageUrl(id),
      statusCode: 404
    });

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    });

    return res.status(fallback.statusCode).send(fallback.html);
  }

  try {
    const property = await Property.findById(id).select('title_es title_en description_es description_en images');

    if (!property) {
      const fallback = renderShareDocument({
        title: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        imageUrl: DEFAULT_IMAGE_URL,
        canonicalUrl: FRONTEND_URL,
        shareUrl: buildSharePageUrl(id),
        statusCode: 404
      });

      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
      });

      return res.status(fallback.statusCode).send(fallback.html);
    }

    const title = normalizeWhitespace(property.title_es || property.title_en || SITE_NAME);
    const description = summarize(property.description_es || property.description_en || DEFAULT_DESCRIPTION);
    const imageUrl = normalizeWhitespace(property.images?.[0] || '') || DEFAULT_IMAGE_URL;
    const canonicalUrl = buildPropertyPageUrl(property._id.toString());
    const shareUrl = buildSharePageUrl(property._id.toString());
    const response = renderShareDocument({ title, description, imageUrl, canonicalUrl, shareUrl });

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=300',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    });

    return res.status(response.statusCode).send(response.html);
  } catch (err) {
    console.error('Error en GET /share/property/:id:', err.message);

    const fallback = renderShareDocument({
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      imageUrl: DEFAULT_IMAGE_URL,
      canonicalUrl: FRONTEND_URL,
      shareUrl: buildSharePageUrl(id),
      statusCode: 500
    });

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    });

    return res.status(fallback.statusCode).send(fallback.html);
  }
});

module.exports = router;