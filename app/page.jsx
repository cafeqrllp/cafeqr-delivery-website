import { FiArrowRight, FiMapPin, FiClock, FiStar } from 'react-icons/fi';

export default function Home() {
  const sampleRestaurants = [
    { id: 'r001', name: 'The Spice Garden', cuisine: 'Kerala • Indian', rating: 4.3, time: '30-45 min', free_delivery: true },
    { id: 'r002', name: 'Chaat Corner',     cuisine: 'Street Food • Snacks', rating: 4.1, time: '20-30 min', free_delivery: false },
    { id: 'r003', name: 'Green Bowl',       cuisine: 'Healthy • Salads',  rating: 4.5, time: '25-35 min', free_delivery: true },
  ];
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-orange to-orange-600 px-5 pt-10 pb-16 text-white">
        <div className="flex items-center gap-1.5 mb-4">
          <FiMapPin size={14} />
          <span className="text-sm opacity-80">Thrissur, Kerala</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight">Order food<br />to your door</h1>
        <p className="text-sm opacity-80 mt-2">Fast delivery from top restaurants near you</p>
        <div className="mt-5 bg-white rounded-xl flex items-center px-4 py-3 gap-2">
          <FiMapPin size={16} className="text-stone-400" />
          <input className="flex-1 text-stone-700 text-sm outline-none bg-transparent" placeholder="Enter your delivery address..." />
        </div>
      </div>

      {/* Restaurants */}
      <div className="px-4 -mt-6 pb-8">
        <h2 className="font-bold text-stone-800 text-lg mb-3">Restaurants Near You</h2>
        <div className="space-y-3">
          {sampleRestaurants.map(r => (
            <a
              key={r.id}
              href={`/order?r=${r.id}&t=DELIVERY`}
              className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <span className="text-5xl">🍽️</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-stone-800">{r.name}</h3>
                    <p className="text-stone-400 text-xs mt-0.5">{r.cuisine}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                    <FiStar size={11} className="text-green-600 fill-green-600" />
                    <span className="text-xs font-bold text-green-600">{r.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                  <span className="flex items-center gap-1"><FiClock size={11} />{r.time}</span>
                  {r.free_delivery && <span className="text-green-500 font-medium">Free delivery</span>}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
