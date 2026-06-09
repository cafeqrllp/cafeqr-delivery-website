// lib/auth.js
// Server-side session helpers for the Delivery Website customer auth flow.
//
// EXPORTS:
//   verifySessionToken(token)  → { email } | null
//   getDeliverySession(req)    → { email } | null   (use in API route handlers)
//   getSessionFromCookies(cookies) → { email } | null  (use in middleware)
//
// HOW IT WORKS:
//   verify-otp/route.js sets a `delivery_session` cookie whose value is:
//     base64(payload) + "." + HMAC-SHA256(base64(payload), INTERNAL_API_SECRET)
//   This file verifies that signature before trusting the payload.
//
// NOTE: Delivery Website customer auth ONLY.
//       Does NOT affect staff/POS auth in cafeTestQRFrontend.

import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE = 'delivery_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Verify a delivery_session token string.
 * Returns the decoded payload { email, iat } if valid, or null if invalid/expired.
 *
 * @param {string} token
 * @returns {{ email: string, iat: number } | null}
 */
export function verifySessionToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;

    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return null;

    const payload = token.slice(0, lastDot);
    const receivedSig = token.slice(lastDot + 1);

    const secret = process.env.INTERNAL_API_SECRET || 'dev-secret-change-me';
    const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');

    // Constant-time comparison to prevent timing attacks
    const received = Buffer.from(receivedSig, 'utf8');
    const expected = Buffer.from(expectedSig, 'utf8');
    if (received.length !== expected.length) return null;
    if (!timingSafeEqual(received, expected)) return null;

    // Decode payload
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));

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
 * Extract and verify session from a Next.js API route Request object.
 * Use this inside app/api/** route handlers.
 *
 * @param {Request} req
 * @returns {{ email: string } | null}
 *
 * @example
 * // In an API route:
 * import { getDeliverySession } from '@/lib/auth';
 * export async function GET(req) {
 *   const session = getDeliverySession(req);
 *   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   // session.email is the verified customer email
 * }
 */
export function getDeliverySession(req) {
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
 * @returns {{ email: string } | null}
 *
 * @example
 * // In middleware.js:
 * import { getSessionFromCookies } from '@/lib/auth';
 * const session = getSessionFromCookies(req.cookies);
 * if (!session) return NextResponse.redirect(loginUrl);
 */
export function getSessionFromCookies(cookies) {
  try {
    const token = cookies.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}
