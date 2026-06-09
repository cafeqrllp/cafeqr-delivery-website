// app/api/auth/verify-otp/route.js
// Verifies the 6-digit OTP submitted by the customer.
// On success: clears OTP from store, sets a signed HttpOnly delivery_session cookie.
//
// CHANGES FROM PREVIOUS VERSION:
//   - All OTP check logic is UNCHANGED.
//   - Added: after successful verify, issue a signed delivery_session cookie
//     using Node built-in `crypto` (HMAC-SHA256 + INTERNAL_API_SECRET).
//     No new npm dependency added.
//
// NOTE: Delivery Website customer auth ONLY.
//       Does NOT affect staff/POS auth in cafeTestQRFrontend.

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { otpStore } from '../send-otp/store';

const SESSION_TTL_DAYS = 7;
const SESSION_COOKIE   = 'delivery_session';

/**
 * Build a self-contained signed token: base64url(payload).signature
 * Signature = HMAC-SHA256( base64url(payload), INTERNAL_API_SECRET )
 */
function buildSessionToken(email) {
  const payload = Buffer.from(JSON.stringify({ email, iat: Date.now() }))
    .toString('base64')
    .replace(/=/g, '');

  const secret = process.env.INTERNAL_API_SECRET || 'dev-secret-change-me';
  const sig = createHmac('sha256', secret).update(payload).digest('hex');

  return `${payload}.${sig}`;
}

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    const record = otpStore.get(email);

    if (!record) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 404 }
      );
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 410 }
      );
    }

    if (record.otp !== String(otp)) {
      return NextResponse.json({ error: 'Incorrect OTP.' }, { status: 401 });
    }

    // ── Success ─────────────────────────────────────────────────────────────
    // 1. Invalidate OTP immediately (one-time use)
    otpStore.delete(email);

    // 2. Build signed session token
    const token = buildSessionToken(email);

    // 3. Set HttpOnly cookie on the response
    const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60; // seconds
    const response = NextResponse.json({ verified: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly  : true,
      secure    : process.env.APP_ENV !== 'development',
      sameSite  : 'lax',
      path      : '/',
      maxAge,
    });

    return response;
  } catch (err) {
    console.error('[verify-otp]', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
