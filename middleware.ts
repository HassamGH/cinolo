import { next } from '@vercel/edge';
import { UNAUTHORIZED_PAGE } from './UNAUTHORIZED_PAGE';

export const config = {
  // Protect everything except the PWA manifest/service worker/icons,
  // which browsers fetch outside the normal credentialed flow.
  matcher: [
    '/((?!manifest\\.webmanifest$|sw\\.js$|registerSW\\.js$|favicon\\.svg$|apple-touch-icon\\.png$|pwa-192x192\\.png$|pwa-512x512\\.png$|maskable-icon-512x512\\.png$).*)',
  ],
};

const REALM = 'Cinolo';

function unauthorized(): Response {
  return new Response(UNAUTHORIZED_PAGE, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'content-type': 'text/html; charset=UTF-8',
      'cache-control': 'no-store',
    },
  });
}

// Timing-safe comparison: hashing both sides first means the response time
// never leaks how many leading characters of a guessed password matched.
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const bytesA = new Uint8Array(digestA);
  const bytesB = new Uint8Array(digestB);
  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}

// Basic Auth carries "username:password"; there's one shared site password
// and no real users, so the username half is ignored and only the password
// half is checked.
function extractPassword(decoded: string): string {
  const separatorIndex = decoded.indexOf(':');
  return separatorIndex === -1 ? decoded : decoded.slice(separatorIndex + 1);
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    // Fail closed: a misconfigured deployment must never silently let everyone through.
    return new Response('Site is not configured for authentication. Set SITE_PASSWORD.', {
      status: 500,
      headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' },
    });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Basic ')) {
    let decoded: string;
    try {
      decoded = atob(authHeader.slice('Basic '.length));
    } catch {
      return unauthorized();
    }
    const password = extractPassword(decoded);
    if (await timingSafeEqual(password, sitePassword)) {
      return next();
    }
  }

  return unauthorized();
}
