// lib/auth.js
// Server-side session helpers for the Delivery Website customer auth flow.
//
// EXPORTS:
//   verifySessionToken(token)      → Promise<{ email } | null>
//   getDeliverySession(req)        → Promise<{ email } | null>  (API route handlers)
//   getSessionFromCookies(cookies) → Promise<{ email } | null>  (middleware)
//
// HOW IT WORKS:
//   verify-otp/route.js sets a `delivery_session` cookie whose value is:
//     base64(payload) + "." + HMAC-SHA256-hex(base64(payload), INTERNAL_API_SECRET)
//   This file verifies that signature before trusting the payload.
//
// IMPORTANT — Edge Runtime compatibility:
//   middleware.js runs in the Next.js Edge Runtime which does NOT support
//   Node.js built-in modules (e.g. `crypto`). This file therefore uses the
//   Web Crypto API (globalThis.crypto.subtle) which is available in both
//   the Edge Runtime and in standard Node.js (v19+, and via the webcrypto
//   polyfill in earlier Node versions bundled with Next.js 14).
//
// NOTE: Delivery Website customer auth ONLY.
//       Does NOT affect staff/POS auth in cafeTestQRFrontend.

const SESSION_COOKIE    = 'delivery_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Web Crypto helpers ────────────────────────────────────────────────────────

/**
 * Import the INTERNAL_API_SECRET as a CryptoKey for HMAC-SHA-256.
 * Result is cached in module scope so we only call importKey once.
 */
let _keyCache = null;
async function getHmacKey() {
  if (_keyCache) return _keyCache;
  const secret = process.env.INTERNAL_API_SECRET || 'dev-secret-change-me';
  const enc    = new TextEncoder();
  _keyCache = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,           // not extractable
    ['sign', 'verify'],
  );
  return _keyCache;
}

/** Convert an ArrayBuffer of bytes to a lowercase hex string. */
function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Constant-time comparison of two hex strings (same length guard first). */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Verify a delivery_session token string.
 * Returns the decoded payload { email, iat } if valid, or null if invalid/expired.
 *
 * @param {string} token
 * @returns {Promise<{ email: string, iat: number } | null>}
 */
export async function verifySessionToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;

    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return null;

    const payload     = token.slice(0, lastDot);
    const receivedSig = token.slice(lastDot + 1);

    // Re-compute expected HMAC
    const key    = await getHmacKey();
    const enc    = new TextEncoder();
    const sigBuf = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const expectedSig = bufToHex(sigBuf);

    // Constant-time comparison
    if (!safeEqual(receivedSig, expectedSig)) return null;

    // Decode payload (base64 → JSON)
    const decoded = JSON.parse(atob(payload));

    // Check token age
    if (!decoded.iat || Date.now() - decoded.iat > SESSION_MAX_AGE_MS) return null;

    // Must have email
    if (!decoded.email || typeof decoded.email !== 'string') return null;

    return { email: decoded.email, iat: decoded.iat };
  } catch {
    return null;
  }
}

/**
 * Extract and verify session from a Next.js App Router Request object.
 * Use this inside app/api/** route handlers.
 *
 * @param {Request} req
 * @returns {Promise<{ email: string } | null>}
 *
 * @example
 * import { getDeliverySession } from '@/lib/auth';
 * export async function GET(req) {
 *   const session = await getDeliverySession(req);
 *   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function getDeliverySession(req) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith(`${SESSION_COOKIE}=`));

    if (!match) return null;
    const token = match.slice(SESSION_COOKIE.length + 1);
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Extract and verify session from a Next.js middleware RequestCookies object.
 * Use this inside middleware.js.
 *
 * @param {import('next/server').NextRequest['cookies']} cookies
 * @returns {Promise<{ email: string } | null>}
 *
 * @example
 * import { getSessionFromCookies } from '@/lib/auth';
 * const session = await getSessionFromCookies(req.cookies);
 * if (!session) return NextResponse.redirect(loginUrl);
 */
export async function getSessionFromCookies(cookies) {
  try {
    const token = cookies.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}
