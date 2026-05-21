import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';
import https from 'https';

// Disable Next.js body parsing — we forward raw body
export const config = {
  api: {
    bodyParser: false,
    // No response size limit, no timeout constraint from Next.js side
    responseLimit: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const parsed = new URL(`${backendUrl}/os-finder/search/ai`);

  const isHttps = parsed.protocol === 'https:';
  const transport = isHttps ? https : http;

  const options: http.RequestOptions = {
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: parsed.pathname,
    method: 'POST',
    headers: {
      ...req.headers,
      host: parsed.host,
    },
    // 60-second socket timeout on the backend-facing connection
    timeout: 60000,
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.status(504).json({ message: 'AI search timed out. Please try again.' });
    }
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.status(502).json({ message: 'Backend connection error', detail: err.message });
    }
  });

  // Pipe incoming request body to proxy request
  req.pipe(proxyReq, { end: true });
}
