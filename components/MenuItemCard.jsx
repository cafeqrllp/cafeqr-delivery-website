'use client';
import Image from 'next/image';
import { FiPlus, FiMinus } from 'react-icons/fi';

export default function MenuItemCard({ item, qty, onAdd, onRemove }) {
  const veg = item.is_veg;
  return (
    <div className="flex gap-3 py-4 border-b border-stone-100 last:border-0 animate-fade-in">
      {/* Image */}
      {item.image_url ? (
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-24 h-24 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">{veg ? '🥬' : '🍗'}</span>
        </div>
      )}
      {/* Details */}
      <div className="flex-1 min-w-0">
        {/* Veg/Non-veg dot */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
            veg ? 'border-green-600' : 'border-red-600'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              veg ? 'bg-green-600' : 'bg-red-600'
            }`} />
          </div>
          {item.is_bestseller && (
            <span className="text-xs text-amber-600 font-medium">Bestseller</span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-stone-800 line-clamp-2">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="font-bold text-stone-800 text-sm">₹{Number(item.price).toFixed(2)}</p>
          {qty > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRemove(item.id)}
                className="w-7 h-7 rounded-lg border border-brand-orange text-brand-orange flex items-center justify-center hover:bg-brand-orange hover:text-white transition-colors"
              >
                <FiMinus size={12} />
              </button>
              <span className="w-5 text-center text-sm font-bold text-brand-orange">{qty}</span>
              <button
                onClick={() => onAdd(item)}
                className="w-7 h-7 rounded-lg bg-brand-orange text-white flex items-center justify-center hover:bg-brand-orange-dark transition-colors"
              >
                <FiPlus size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(item)}
              className="flex items-center gap-1 bg-brand-orange-50 border border-brand-orange text-brand-orange text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-orange hover:text-white transition-colors"
            >
              <FiPlus size={11} /> ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
