// psx-proxy (Vercel) — same relay contract as cloudflare/psx-proxy-worker.js,
// pinned to Mumbai (bom1, see vercel.json) since PSX's firewall blocks
// US-datacenter egress. scrape-psx can use either relay via PSX_PROXY_URL.
//
// Requires a PROXY_KEY environment variable in the Vercel project settings
// (same value as the PSX_PROXY_KEY Supabase secret).

const ALLOWED_PATHS = ['/market-watch', '/indices'];

export default async function handler(req, res) {
  const key = process.env.PROXY_KEY;
  if (key && req.headers['x-proxy-key'] !== key) {
    return res.status(403).send('Forbidden');
  }

  const path = typeof req.query.path === 'string' ? req.query.path : '/market-watch';
  if (!ALLOWED_PATHS.includes(path)) {
    return res.status(400).send('Path not allowed');
  }

  const upstream = await fetch(`https://dps.psx.com.pk${path}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/html, */*',
      'Referer': 'https://dps.psx.com.pk/',
    },
  });

  const body = await upstream.text();
  res
    .status(upstream.status)
    .setHeader('Content-Type', upstream.headers.get('content-type') ?? 'text/html')
    .setHeader('Cache-Control', 'no-store')
    .send(body);
}
