import { next } from '@vercel/edge';
import { CONFIG_ERROR_PAGE, UNAUTHORIZED_PAGE } from './UNAUTHORIZED_PAGE.js';

export const config = {
  // Protect everything except the PWA manifest/service worker/icons (which
  // browsers fetch outside the normal credentialed flow) and the TMDB proxy
  // (background fetch() calls from the SPA don't reliably resend cached
  // Basic-Auth credentials, and the proxy only serves public movie/show
  // metadata anyway).
  matcher: [
    '/((?!manifest\\.webmanifest$|sw\\.js$|registerSW\\.js$|workbox-.*\\.js$|favicon\\.svg$|apple-touch-icon\\.png$|pwa-192x192\\.png$|pwa-512x512\\.png$|maskable-icon-512x512\\.png$|api/).*)',
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

// Basic Auth carries "username:password" — each entry in SITE_USERS is one
// person's login, so both halves matter.
function extractCredentials(decoded: string): { username: string; password: string } {
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) return { username: decoded, password: '' };
  return { username: decoded.slice(0, separatorIndex), password: decoded.slice(separatorIndex + 1) };
}

type SiteUsers = Record<string, string>;

// SITE_USERS is a JSON object mapping username to password, e.g.
// {"alice":"hunter2","bob":"correct horse battery staple"}.
function parseSiteUsers(raw: string): SiteUsers | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length === 0) return null;
  if (entries.some(([, password]) => typeof password !== 'string' || password.length === 0)) return null;
  return parsed as SiteUsers;
}

// Never a real user's password — just something to hash against so an
// unknown username costs the same as a wrong one. Its value doesn't need to
// be secret: a match against it is never treated as a successful login (see
// the `expectedPassword !== undefined` check below).
const DUMMY_PASSWORD = 'no-such-user-timing-decoy';

export default async function middleware(request: Request): Promise<Response | undefined> {
  const rawSiteUsers = process.env.SITE_USERS;
  const siteUsers = rawSiteUsers ? parseSiteUsers(rawSiteUsers) : null;
  if (!siteUsers) {
    // Fail closed: a misconfigured deployment must never silently let everyone through.
    return new Response(CONFIG_ERROR_PAGE, {
      status: 500,
      headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'no-store' },
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
    const { username, password } = extractCredentials(decoded);
    const expectedPassword = siteUsers[username];
    // Always run the hash comparison, known user or not, so "wrong
    // password" and "no such user" take the same amount of time.
    const matches = await timingSafeEqual(password, expectedPassword ?? DUMMY_PASSWORD);
    if (expectedPassword !== undefined && matches) {
      return next();
    }
  }

  return unauthorized();
}
