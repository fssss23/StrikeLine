// psx-proxy — Cloudflare Worker that relays fetches to dps.psx.com.pk.
//
// Why: PSX's firewall blocks AWS and some US-datacenter egress (HTTP 462),
// but allows Cloudflare's European colos (verified: MRS → 200). A Worker
// runs in the colo nearest the caller, so calls from Supabase (US) egress
// from blocked IPs. Fix: try the local colo first; when PSX blocks it,
// relay through a Durable Object pinned to Western Europe (locationHint),
// whose egress PSX allows.
//
// Deploy:  npx wrangler deploy --config cloudflare/wrangler.jsonc
// Secret:  PROXY_KEY (same value as the PSX_PROXY_KEY Supabase secret)
//
// Usage:   GET <worker-url>?path=/market-watch   (only dps.psx.com.pk paths)
//          GET <worker-url>?debug=1              (colos + PSX status per hop)

const ALLOWED_PATHS = ['/market-watch', '/indices'];

// If weur ever gets blocked, bump the name AND the hint together — the hint
// only applies when a DO name is first used (placement is sticky per name).
const RELAY_NAME = 'relay-weur-v1';
const RELAY_HINT = 'weur';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/html, */*',
  'Referer': 'https://dps.psx.com.pk/',
};

function passthrough(upstream) {
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'text/html',
      'Cache-Control': 'no-store',
    },
  });
}

async function currentColo() {
  try {
    const trace = await fetch('https://www.cloudflare.com/cdn-cgi/trace').then((r) => r.text());
    return trace.match(/^colo=(.+)$/m)?.[1] ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function psxStatus() {
  return fetch('https://dps.psx.com.pk/market-watch', { headers: BROWSER_HEADERS })
    .then((r) => r.status)
    .catch((e) => `fetch-failed: ${e.message}`);
}

// Pinned relay: executes wherever the DO lives, not where the caller is
export class PsxRelay {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.searchParams.get('debug') === '1') {
      const [relayColo, relayPsxStatus] = await Promise.all([currentColo(), psxStatus()]);
      return Response.json({ relayColo, relayPsxStatus });
    }

    const path = url.searchParams.get('path') ?? '/market-watch';
    if (!ALLOWED_PATHS.includes(path)) {
      return new Response('Path not allowed', { status: 400 });
    }
    const upstream = await fetch(`https://dps.psx.com.pk${path}`, { headers: BROWSER_HEADERS });
    return passthrough(upstream);
  }
}

export default {
  async fetch(request, env, ctx) {
    if (env.PROXY_KEY && request.headers.get('X-Proxy-Key') !== env.PROXY_KEY) {
      return new Response('Forbidden', { status: 403 });
    }

    const url = new URL(request.url);
    const relayStub = () =>
      env.PSX_RELAY.get(env.PSX_RELAY.idFromName(RELAY_NAME), { locationHint: RELAY_HINT });

    // Smart Placement only optimizes Workers making 2+ subrequests per
    // request — this extra HEAD to the same backend qualifies us.
    ctx.waitUntil(
      fetch('https://dps.psx.com.pk/', { method: 'HEAD', headers: BROWSER_HEADERS }).catch(() => {})
    );

    if (url.searchParams.get('debug') === '1') {
      const [execColo, localPsxStatus, relayInfo] = await Promise.all([
        currentColo(),
        psxStatus(),
        relayStub()
          .fetch('https://relay/?debug=1')
          .then((r) => r.json())
          .catch((e) => ({ relayError: e.message })),
      ]);
      return Response.json({
        ingressColo: request.cf?.colo ?? 'unknown',
        execColo,
        localPsxStatus,
        ...relayInfo,
      });
    }

    const path = url.searchParams.get('path') ?? '/market-watch';
    if (!ALLOWED_PATHS.includes(path)) {
      return new Response('Path not allowed', { status: 400 });
    }

    const direct = await fetch(`https://dps.psx.com.pk${path}`, { headers: BROWSER_HEADERS });
    if (direct.ok) return passthrough(direct);

    // PSX blocks this colo's egress — go through the pinned relay instead
    const relayed = await relayStub().fetch(`https://relay/?path=${encodeURIComponent(path)}`);
    return passthrough(relayed);
  },
};
