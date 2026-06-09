'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiMapPin, FiUser, FiPhone, FiCreditCard, FiCheck, FiMail } from 'react-icons/fi';

// ── CHANGES FROM PREVIOUS VERSION ────────────────────────────────────────────
// 1. OTP flow removed from Step 1 entirely (auth now handled at app/page.jsx).
// 2. On mount, GET /api/auth/session to pre-fill customer email from session.
//    Email is shown as a read-only verified field — not editable here.
// 3. validateStep1 no longer checks OTP — only name + phone.
// 4. Payment step: COD only. UPI and Card options removed.
// 5. All other logic (cart, address, placeOrder, step indicator) UNCHANGED.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cafe-qr-backend.onrender.com/api';

function CheckoutPageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const restaurantId = searchParams.get('r');
  const orderType    = searchParams.get('t') || 'DELIVERY';

  // Steps: 1=contact, 2=address, 3=payment+confirm
  const [step, setStep]             = useState(1);
  const [cart, setCart]             = useState([]);
  const [restaurant, setRestaurant] = useState(null);

  // Step 1 — contact
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');        // pre-filled from session, read-only
  const [sessionLoading, setSessionLoading] = useState(true);

  // Step 2 — address
  const [address, setAddress] = useState({ line1: '', area: '', city: 'Thrissur', pincode: '' });

  // Step 3 — payment (COD only)
  const [payment, setPayment] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const [errors,  setErrors]  = useState({});

  // ── Load cart + restaurant from sessionStorage ──────────────────────────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`cart_${restaurantId}`);
      if (saved) setCart(JSON.parse(saved));
    } catch {}
    try {
      const r = sessionStorage.getItem(`restaurant_${restaurantId}`);
      if (r) setRestaurant(JSON.parse(r));
    } catch {}
  }, [restaurantId]);

  // ── Pre-fill email from delivery_session cookie (via /api/auth/session) ─────
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.email) setEmail(data.email); })
      .catch(() => {})
      .finally(() => setSessionLoading(false));
  }, []);

  const cartTotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount   = cart.reduce((s, i) => s + i.qty, 0);
  const deliveryFee = orderType === 'TAKEAWAY' ? 0 : (cartTotal >= 500 ? 0 : 40);
  const grandTotal  = cartTotal + deliveryFee;

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone)) e.phone = 'Enter a valid 10-digit mobile number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    if (orderType === 'TAKEAWAY') return true;
    const e = {};
    if (!address.line1.trim())   e.line1   = 'House / flat is required';
    if (!address.area.trim())    e.area    = 'Area / locality is required';
    if (!address.pincode.trim()) e.pincode = 'Pincode is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Place order ─────────────────────────────────────────────────────────────
  const placeOrder = async () => {
    setPlacing(true);
    try {
      const payload = {
        restaurantId,
        orderType,
        customer: { name, phone, email },
        address: orderType === 'DELIVERY' ? address : null,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        payment,
        total: grandTotal,
      };

      let orderId;
      try {
        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const data = await res.json();
          orderId = data.orderId || data.id || data.order_id;
        } else {
          throw new Error('Backend error');
        }
      } catch {
        orderId = 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      }

      try { sessionStorage.removeItem(`cart_${restaurantId}`); } catch {}
      router.push(`/track?id=${orderId}&r=${restaurantId}`);
    } finally {
      setPlacing(false);
    }
  };

  const STEPS = [
    { num: 1, label: 'Contact' },
    { num: 2, label: orderType === 'TAKEAWAY' ? 'Confirm' : 'Address' },
    { num: 3, label: 'Payment' },
  ];

  if (cart.length === 0 && step < 3) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">🛒</span>
        <h2 className="font-bold text-stone-800 text-lg">Your cart is empty</h2>
        <button onClick={() => router.back()} className="bg-brand-orange text-white px-6 py-3 rounded-xl font-semibold text-sm">← Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-stone-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => step === 1 ? router.back() : setStep(s => s - 1)}
            className="p-1.5 -ml-1 rounded-lg hover:bg-stone-100 text-stone-500"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-stone-900 text-lg">Checkout</h1>
        </div>

        {/* Step indicator */}
        <div className="flex px-4 pb-3 gap-0">
          {STEPS.map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  step > s.num  ? 'bg-green-500 border-green-500 text-white' :
                  step === s.num ? 'bg-brand-orange border-brand-orange text-white' :
                                   'bg-white border-stone-200 text-stone-400'
                }`}>
                  {step > s.num ? <FiCheck size={12} /> : s.num}
                </div>
                <span className={`text-xs mt-0.5 ${
                  step >= s.num ? 'text-stone-600 font-medium' : 'text-stone-300'
                }`}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-3 mx-1 ${
                  step > s.num ? 'bg-brand-orange' : 'bg-stone-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 pb-36">

        {/* Cart summary (always visible) */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              {cartCount} item{cartCount !== 1 ? 's' : ''}
            </span>
            <button onClick={() => router.back()} className="text-xs text-brand-orange font-medium">Edit</button>
          </div>
          {cart.map(i => (
            <div key={i.id} className="flex justify-between text-sm py-1">
              <span className="text-stone-700">{i.name} × {i.qty}</span>
              <span className="font-medium text-stone-800">₹{(i.price * i.qty).toFixed(0)}</span>
            </div>
          ))}
          <div className="border-t border-stone-100 mt-2 pt-2 space-y-1">
            <div className="flex justify-between text-sm text-stone-500">
              <span>Subtotal</span><span>₹{cartTotal.toFixed(0)}</span>
            </div>
            {orderType === 'DELIVERY' && (
              <div className="flex justify-between text-sm text-stone-500">
                <span>Delivery fee</span>
                <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-stone-900 pt-1">
              <span>Total</span><span>₹{grandTotal.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* ── Step 1: Contact details ──────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FiUser size={18} className="text-brand-orange" />
              <h2 className="font-semibold text-stone-800">Your Details</h2>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Full Name</label>
              <input
                className={`w-full mt-1.5 border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                  errors.name ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-brand-orange'
                }`}
                placeholder="Enter your full name"
                value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Mobile Number</label>
              <div className="flex gap-2 mt-1.5">
                <div className="border border-stone-200 rounded-xl px-3 py-3 text-sm text-stone-400 bg-stone-50">+91</div>
                <input
                  className={`flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                    errors.phone ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-brand-orange'
                  }`}
                  placeholder="10-digit number"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })); }}
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Email — read-only, pre-filled from session */}
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Email</label>
              <div className="relative mt-1.5">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                {sessionLoading ? (
                  <div className="w-full border border-stone-200 rounded-xl px-4 py-3 pl-9 bg-stone-50 text-sm text-stone-300 animate-pulse">Loading…</div>
                ) : (
                  <input
                    className="w-full border border-green-300 bg-green-50 rounded-xl pl-9 pr-10 py-3 text-sm text-stone-600 outline-none cursor-default"
                    value={email}
                    readOnly
                    tabIndex={-1}
                  />
                )}
                {!sessionLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <FiCheck size={11} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-1">Verified via OTP at sign-in</p>
            </div>
          </div>
        )}

        {/* ── Step 2: Address / Takeaway confirm ──────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiMapPin size={18} className="text-brand-orange" />
              <h2 className="font-semibold text-stone-800">
                {orderType === 'TAKEAWAY' ? 'Pickup Confirmation' : 'Delivery Address'}
              </h2>
            </div>
            {orderType === 'TAKEAWAY' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-800">🛖 Takeaway Order</p>
                <p className="text-xs text-amber-600">Your order will be ready for pickup. We'll send a confirmation to {email}.</p>
                <div className="border-t border-amber-200 pt-2 mt-2">
                  <p className="text-xs text-amber-700 font-medium">{name}</p>
                  <p className="text-xs text-amber-700">+91 {phone}</p>
                  <p className="text-xs text-amber-700">{email}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">House / Flat / Building</label>
                  <input
                    className={`w-full mt-1.5 border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                      errors.line1 ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-brand-orange'
                    }`}
                    placeholder="Flat 4B, Rose Apartments"
                    value={address.line1}
                    onChange={e => { setAddress(p => ({...p, line1: e.target.value})); setErrors(p => ({...p, line1: ''})); }}
                  />
                  {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Area / Locality</label>
                  <input
                    className={`w-full mt-1.5 border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                      errors.area ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-brand-orange'
                    }`}
                    placeholder="Swaraj Round, Punkunnam"
                    value={address.area}
                    onChange={e => { setAddress(p => ({...p, area: e.target.value})); setErrors(p => ({...p, area: ''})); }}
                  />
                  {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area}</p>}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">City</label>
                    <input className="w-full mt-1.5 border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 text-stone-400" value={address.city} readOnly />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Pincode</label>
                    <input
                      className={`w-full mt-1.5 border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        errors.pincode ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-brand-orange'
                      }`}
                      placeholder="680001"
                      value={address.pincode}
                      onChange={e => { setAddress(p => ({...p, pincode: e.target.value})); setErrors(p => ({...p, pincode: ''})); }}
                      maxLength={6}
                      inputMode="numeric"
                    />
                    {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Payment (COD only) ───────────────────────────── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiCreditCard size={18} className="text-brand-orange" />
              <h2 className="font-semibold text-stone-800">Payment Method</h2>
            </div>
            {/* COD — only option for now */}
            <button
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-brand-orange bg-orange-50 cursor-default"
            >
              <span className="text-2xl">💵</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-orange-700">Cash on Delivery</p>
                <p className="text-xs text-stone-400">Pay when your order arrives</p>
              </div>
              <div className="ml-auto w-5 h-5 rounded-full border-2 border-brand-orange bg-brand-orange flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </button>
            <p className="text-xs text-stone-300 text-center mt-3">Online payment coming soon</p>
          </div>
        )}

      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-4 py-4">
        {step < 3 ? (
          <button
            onClick={() => {
              if (step === 1 && !validateStep1()) return;
              if (step === 2 && !validateStep2()) return;
              setStep(s => s + 1);
            }}
            className="w-full bg-brand-orange hover:bg-orange-600 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={placeOrder}
            disabled={placing}
            className="w-full bg-brand-orange hover:bg-orange-600 disabled:opacity-70 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {placing
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing Order…</>
              : `Place Order · ₹${grandTotal}`
            }
          </button>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutPageInner />
    </Suspense>
  );
}
