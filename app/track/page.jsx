'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiPhone, FiHome } from 'react-icons/fi';
import OrderStatusStepper from '@/components/OrderStatusStepper';

const STATUS_SEQUENCE = ['PENDING','CONFIRMED','PREPARING','ASSIGNED','PICKED_UP','DELIVERED'];

function TrackPageInner() {
  const searchParams = useSearchParams();
  const orderId      = searchParams.get('id');
  const [statusIdx, setStatusIdx] = useState(0);
  const [eta, setEta]             = useState(40);

  // Simulate status progression (replace with real polling / Supabase Realtime)
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx(i => {
        if (i >= STATUS_SEQUENCE.length - 1) { clearInterval(interval); return i; }
        return i + 1;
      });
      setEta(e => Math.max(0, e - 5));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const status    = STATUS_SEQUENCE[statusIdx];
  const delivered = status === 'DELIVERED';

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-stone-900 text-lg">Order Tracking</h1>
            <p className="text-stone-400 text-xs mt-0.5">#{orderId}</p>
          </div>
          <a href="/" className="p-2 rounded-xl bg-stone-100 text-stone-500">
            <FiHome size={18} />
          </a>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* ETA Banner */}
        {!delivered ? (
          <div className="bg-gradient-to-r from-brand-orange to-orange-400 rounded-2xl p-5 text-white">
            <p className="text-sm opacity-80 mb-1">Estimated arrival</p>
            <p className="text-4xl font-bold">{eta} <span className="text-lg font-normal">min</span></p>
            <p className="text-sm opacity-80 mt-1">Your food is on its way!</p>
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-5 text-center">
            <p className="text-5xl mb-2">🎉</p>
            <p className="text-green-700 font-bold text-lg">Order Delivered!</p>
            <p className="text-green-500 text-sm mt-1">Enjoy your meal. Thank you for ordering!</p>
          </div>
        )}

        {/* Stepper */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-semibold text-stone-800 mb-4">Order Status</h2>
          <OrderStatusStepper status={status} />
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-semibold text-stone-800 mb-3">Need Help?</h2>
          <a
            href="tel:+919876543210"
            className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-4 hover:border-brand-orange transition-colors"
          >
            <div className="w-10 h-10 bg-brand-orange-50 rounded-xl flex items-center justify-center">
              <FiPhone size={18} className="text-brand-orange" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">Call Restaurant</p>
              <p className="text-xs text-stone-400">+91 98765 43210</p>
            </div>
          </a>
        </div>

        {/* Reorder / Home */}
        {delivered && (
          <a
            href="/"
            className="block w-full bg-brand-orange hover:bg-brand-orange-dark text-white text-center font-semibold py-4 rounded-xl transition-colors"
          >
            Order Again
          </a>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TrackPageInner />
    </Suspense>
  );
}
