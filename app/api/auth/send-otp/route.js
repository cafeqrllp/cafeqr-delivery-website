// app/api/auth/send-otp/route.js
// Generates a 6-digit OTP, stores it in the shared otpStore (store.js),
// and sends it to the customer's email via Gmail API (lib/gmailMailer.js).
//
// CHANGES FROM PREVIOUS VERSION:
//   1. Removed private `const otpStore = new Map()` — now imports from ./store
//      so that verify-otp/route.js reads from the SAME Map instance.
//   2. Removed nodemailer (not installed) — now uses lib/gmailMailer.js sendEmail()
//      which uses googleapis (already installed) + GMAIL_* env vars.
//
// NOTE: This file is part of the Delivery Website customer auth flow ONLY.
//       It does NOT touch staff/owner auth used by cafeTestQRFrontend (POS app).

import { NextResponse } from 'next/server';
import { otpStore } from './store';
import { sendEmail } from '@/lib/gmailMailer';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Rate-limit: don't resend if OTP is still fresh (< 1 min old)
    const existing = otpStore.get(email);
    if (existing && existing.expiresAt - Date.now() > OTP_TTL_MS - 60000) {
      return NextResponse.json(
        { message: 'OTP already sent. Please wait a moment before requesting again.' },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS });

    // Send OTP email via Gmail API (lib/gmailMailer.js)
    await sendEmail({
      to: email,
      subject: 'Your CafeQR Order Verification Code',
      htmlBody: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff; border-radius: 16px; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #EA580C; color: white; font-weight: bold; font-size: 18px; padding: 12px 20px; border-radius: 12px;">CafeQR Delivery</div>
          </div>
          <h2 style="font-size: 20px; color: #1c1917; margin-bottom: 8px;">Your verification code</h2>
          <p style="color: #78716c; font-size: 14px; margin-bottom: 24px;">Enter this code to sign in. It expires in 10 minutes.</p>
          <div style="background: #fff7ed; border: 2px dashed #ea580c; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ea580c;">${otp}</span>
          </div>
          <p style="color: #a8a29e; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
      textBody: `Your CafeQR Delivery verification code is: ${otp}. It expires in 10 minutes.`,
    });

    return NextResponse.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('[send-otp]', err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
