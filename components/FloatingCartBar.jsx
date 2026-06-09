'use client';
import { FiShoppingBag, FiArrowRight } from 'react-icons/fi';

export default function FloatingCartBar({ cart, onClick }) {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const totalAmt = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (totalQty === 0) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 animate-slide-up">
      <button
        onClick={onClick}
        className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg shadow-orange-200 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg px-2.5 py-1 text-sm font-bold">
            {totalQty}
          </div>
          <span className="font-semibold text-sm">View Cart</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">₹{totalAmt.toFixed(2)}</span>
          <FiArrowRight size={16} />
        </div>
      </button>
    </div>
  );
}
