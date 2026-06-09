'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiMapPin, FiUser, FiPhone, FiCreditCard, FiCheck } from 'react-icons/fi';

function CheckoutPageInner() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const restaurantId  = searchParams.get('r');
  const orderType     = searchParams.get('t') || 'DELIVERY';

  const [step, setStep]     = useState(1); // 1=details, 2=address, 3=payment
  const [form, setForm]     = useState({ name: '', phone: '' });
  const [address, setAddress] = useState({ line1: '', area: '', city: 'Thrissur', pincode: '' });
  const [payment, setPayment] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]  = useState({});

  const handleField = (obj, key, val) => {
    if (obj === 'form')    setForm(p => ({ ...p, [key]: val }));
    if (obj === 'address') setAddress(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    if (orderType === 'TAKEAWAY') return true;
    const e = {};
    if (!address.line1.trim())   e.line1   = 'Address is required';
    if (!address.area.trim())    e.area    = 'Area / locality is required';
    if (!address.pincode.trim()) e.pincode = 'Pincode is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    setLoading(true);
    // TODO: POST to /api/orders when backend is ready
    await new Promise(r => setTimeout(r, 1200));
    const fakeOrderId = 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    router.push(`/track?id=${fakeOrderId}`);
  };

  const STEPS = [
    { num: 1, label: 'Your Details' },
    { num: 2, label: orderType === 'TAKEAWAY' ? 'Confirm' : 'Address' },
    { num: 3, label: 'Payment' },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-stone-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-1.5 -ml-1 rounded-lg hover:bg-stone-100 text-stone-500">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-stone-900 text-lg">Checkout</h1>
        </div>
        {/* Steps */}
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
                  step > s.num + 1 ? 'bg-green-400' :
                  step > s.num     ? 'bg-brand-orange' : 'bg-stone-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 pb-32">
        {/* Step 1 — Personal Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <FiUser size={18} className="text-brand-orange" />
              <h2 className="font-semibold text-stone-800">Your Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Full Name</label>
                <input
                  className={`w-full mt-1.5 border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                    errors.name ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-brand-orange'
                  }`}
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => handleField('form', 'name', e.target.value)}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Mobile Number</label>
                <div className="flex gap-2 mt-1.5">
                  <div className="border border-stone-200 rounded-xl px-3 py-3 text-sm text-stone-500 bg-stone-50">+91</div>
                  <input
                    className={`flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                      errors.phone ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-brand-orange'
                    }`}
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={e => handleField('form', 'phone', e.target.value)}
                    maxLength={10}
                    inputMode="numeric"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Address (delivery) or Confirm (takeaway) */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <FiMapPin size={18} className="text-brand-orange" />
              <h2 className="font-semibold text-stone-800">
                {orderType === 'TAKEAWAY' ? 'Order Summary' : 'Delivery Address'}
              </h2>
            </div>
            {orderType === 'TAKEAWAY' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800">🛖 Takeaway Order</p>
                <p className="text-xs text-amber-600 mt-1">Your order will be ready for pickup at the restaurant. We'll notify you when it's ready.</p>
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-xs text-amber-700 font-medium">Ordering as: {form.name}</p>
                  <p className="text-xs text-amber-700">+91 {form.phone}</p>
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
                    placeholder="e.g. Flat 4B, Rose Apartments"
                    value={address.line1}
                    onChange={e => handleField('address', 'line1', e.target.value)}
                  />
                  {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Area / Locality</label>
                  <input
                    className={`w-full mt-1.5 border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                      errors.area ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-brand-orange'
                    }`}
                    placeholder="e.g. Swaraj Round, Punkunnam"
                    value={address.area}
                    onChange={e => handleField('address', 'area', e.target.value)}
                  />
                  {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area}</p>}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">City</label>
                    <input className="w-full mt-1.5 border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 text-stone-500" value={address.city} readOnly />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Pincode</label>
                    <input
                      className={`w-full mt-1.5 border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                        errors.pincode ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-brand-orange'
                      }`}
                      placeholder="680001"
                      value={address.pincode}
                      onChange={e => handleField('address', 'pincode', e.target.value)}
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

        {/* Step 3 — Payment */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FiCreditCard size={18} className="text-brand-orange" />
                <h2 className="font-semibold text-stone-800">Payment Method</h2>
              </div>
              <div className="space-y-2">
                {[
                  { val: 'COD',   label: 'Cash on Delivery', desc: 'Pay when order arrives', icon: '💵' },
                  { val: 'UPI',   label: 'UPI',              desc: 'PhonePe, GPay, Paytm', icon: '📱' },
                  { val: 'CARD',  label: 'Debit / Credit Card', desc: 'Visa, Mastercard, RuPay', icon: '💳' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setPayment(opt.val)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      payment === opt.val ? 'border-brand-orange bg-orange-50' : 'border-stone-100 hover:border-stone-200'
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${payment === opt.val ? 'text-brand-orange-dark' : 'text-stone-800'}`}>{opt.label}</p>
                      <p className="text-xs text-stone-400">{opt.desc}</p>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      payment === opt.val ? 'border-brand-orange bg-brand-orange' : 'border-stone-300'
                    }`}>
                      {payment === opt.val && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-4 py-4">
        {step < 3 ? (
          <button
            onClick={() => {
              if (step === 1 && !validateStep1()) return;
              if (step === 2 && !validateStep2()) return;
              setStep(s => s + 1);
            }}
            className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold py-4 rounded-xl transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={placeOrder}
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-brand-orange-dark disabled:opacity-70 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing Order…</>
            ) : (
              'Place Order'
            )}
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
