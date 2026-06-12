// psx-proxy — tiny Cloudflare Worker that relays fetches to dps.psx.com.pk.
//
// Why: PSX's firewall blocks Supabase Edge Function egress IPs (HTTP 462),
// but serves Cloudflare/browser traffic fine. scrape-psx tries PSX directly
// first and falls back to this proxy when PSX_PROXY_URL is configured.
//
// Deploy (no CLI needed):
//   1. dash.cloudflare.com → Workers & Pages → Create → Worker ("psx-proxy")
//   2. Paste this file, Deploy
//   3. Worker → Settings → Variables and Secrets → add secret PROXY_KEY
//      (any long random string)
//   4. supabase secrets:  PSX_PROXY_URL=https://psx-proxy.<account>.workers.dev
//                         PSX_PROXY_KEY=<same random string>
//
// Usage: GET <worker-url>?path=/market-watch   (only dps.psx.com.pk paths)

const ALLOWED_PATHS = ['/market-watch', '/indices'];

export default {
  async fetch(request, env) {
    if (env.PROXY_KEY && request.headers.get('X-Proxy-Key') !== env.PROXY_KEY) {
      return new Response('Forbidden', { status: 403 });
    }

    const path = new URL(request.url).searchParams.get('path') ?? '/market-watch';
    if (!ALLOWED_PATHS.includes(path)) {
      return new Response('Path not allowed', { status: 400 });
    }

    const upstream = await fetch(`https://dps.psx.com.pk${path}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/html, */*',
        'Referer': 'https://dps.psx.com.pk/',
      },
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'text/html',
        'Cache-Control': 'no-store',
      },
    });
  },
};
