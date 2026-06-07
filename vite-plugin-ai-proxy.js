import { loadEnv } from 'vite';

const UPSTREAM_URL = 'https://gen.ai.kku.ac.th/api/v1/chat/completions';
const ROUTE = '/api/analyze';
const UPSTREAM_TIMEOUT_MS = 25000;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function jsonResponse(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function handleAnalyze(req, res, apiKey) {
  if (req.method !== 'POST') {
    jsonResponse(res, 405, { error: 'Method not allowed' });
    return;
  }

  let rawBody;
  try {
    rawBody = await readBody(req);
  } catch (e) {
    jsonResponse(res, 400, { error: 'Failed to read request body' });
    return;
  }

  if (!rawBody || rawBody.length === 0) {
    jsonResponse(res, 400, { error: 'Empty request body' });
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: rawBody,
      signal: controller.signal
    });

    const responseBody = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    res.end(responseBody);
  } catch (e) {
    if (e.name === 'AbortError') {
      jsonResponse(res, 504, { error: 'Upstream request timed out' });
    } else {
      jsonResponse(res, 502, { error: `Upstream request failed: ${e.message}` });
    }
  } finally {
    clearTimeout(timer);
  }
}

function resolveApiKey(server) {
  const env = loadEnv(server.config.env.mode || 'development', server.config.env.root || process.cwd(), '');
  return env.AI_API_KEY || process.env.AI_API_KEY || '';
}

function makeMiddleware(server) {
  return async (req, res, next) => {
    if (!req.url || !req.url.startsWith(ROUTE)) {
      return next();
    }

    const apiKey = resolveApiKey(server);
    if (!apiKey) {
      console.error(`[ai-proxy] ${ROUTE} called but AI_API_KEY is not set in the server environment (.env).`);
      jsonResponse(res, 500, {
        error: 'AI_API_KEY is not configured on the server. Add it to your .env file.'
      });
      return;
    }

    try {
      await handleAnalyze(req, res, apiKey);
    } catch (e) {
      console.error('[ai-proxy] Unhandled error:', e);
      if (!res.headersSent) {
        jsonResponse(res, 500, { error: e.message || 'Internal proxy error' });
      }
    }
  };
}

export default function aiApiProxy() {
  return {
    name: 'ai-api-proxy',
    configureServer(server) {
      server.middlewares.use(makeMiddleware(server));
    },
    configurePreviewServer(server) {
      server.middlewares.use(makeMiddleware(server));
    }
  };
}
