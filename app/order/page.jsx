'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiSearch, FiMapPin, FiShoppingBag, FiStar, FiClock, FiChevronRight } from 'react-icons/fi';
import MenuItemCard from '@/components/MenuItemCard';
import CartDrawer from '@/components/CartDrawer';
import FloatingCartBar from '@/components/FloatingCartBar';

function OrderPageInner() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('r');
  const orderType    = searchParams.get('t') || 'DELIVERY';

  const [restaurant, setRestaurant]   = useState(null);
  const [menu, setMenu]               = useState([]);
  const [categories, setCategories]   = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart]               = useState([]);
  const [cartOpen, setCartOpen]       = useState(false);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const categoryRefs                  = useRef({});

  // ── Load demo data (replace with real API call when backend is ready) ──
  useEffect(() => {
    setLoading(true);
    // Simulated API response — replace with:
    // const res = await fetch(`/api/menu?r=${restaurantId}`);
    setTimeout(() => {
      setRestaurant({
        name: 'The Spice Garden',
        tagline: 'Authentic Kerala Cuisine',
        address: 'MG Road, Thrissur, Kerala',
        rating: 4.3,
        delivery_time: '30-45 min',
        min_order: 150,
        image_url: null,
      });
      const items = [
        // Starters
        { id: 's1', category: 'Starters', name: 'Kerala Prawn Fry', description: 'Crispy prawns marinated in Kerala spices, shallow fried to perfection', price: 280, is_veg: false, is_bestseller: true, image_url: null },
        { id: 's2', category: 'Starters', name: 'Vegetable Cutlet', description: 'Mixed vegetable cutlets with cashews and spices', price: 120, is_veg: true, is_bestseller: false, image_url: null },
        { id: 's3', category: 'Starters', name: 'Chicken 65', description: 'Deep fried chicken with curry leaves and coconut oil', price: 220, is_veg: false, is_bestseller: true, image_url: null },
        // Mains
        { id: 'm1', category: 'Mains', name: 'Malabar Biryani', description: 'Fragrant rice cooked with tender chicken, fried onions and saffron', price: 320, is_veg: false, is_bestseller: true, image_url: null },
        { id: 'm2', category: 'Mains', name: 'Avial', description: 'Mixed vegetables in a coconut-yoghurt gravy, served with rice', price: 160, is_veg: true, is_bestseller: false, image_url: null },
        { id: 'm3', category: 'Mains', name: 'Fish Molee', description: 'Tender fish in a mild coconut milk curry', price: 290, is_veg: false, is_bestseller: false, image_url: null },
        { id: 'm4', category: 'Mains', name: 'Palak Paneer', description: 'Cottage cheese cubes in a spiced spinach gravy', price: 200, is_veg: true, is_bestseller: false, image_url: null },
        // Breads
        { id: 'b1', category: 'Breads', name: 'Kerala Parotta', description: 'Flaky layered flatbread, best with curry', price: 35, is_veg: true, is_bestseller: true, image_url: null },
        { id: 'b2', category: 'Breads', name: 'Appam', description: 'Soft fermented rice pancakes with crispy edges', price: 40, is_veg: true, is_bestseller: false, image_url: null },
        // Beverages
        { id: 'v1', category: 'Beverages', name: 'Sulaimani', description: 'Spiced black tea with lemon, a Malabar classic', price: 60, is_veg: true, is_bestseller: false, image_url: null },
        { id: 'v2', category: 'Beverages', name: 'Fresh Lime Soda', description: 'Chilled lime with soda, sweet or salted', price: 70, is_veg: true, is_bestseller: false, image_url: null },
        { id: 'v3', category: 'Beverages', name: 'Tender Coconut', description: 'Fresh tender coconut water served chilled', price: 80, is_veg: true, is_bestseller: true, image_url: null },
      ];
      setMenu(items);
      const cats = [...new Set(items.map(i => i.category))];
      setCategories(cats);
      setActiveCategory(cats[0]);
      setLoading(false);
    }, 600);
  }, [restaurantId]);

  // Cart helpers
  const addItem = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), qty: 1 }];
    });
  };
  const removeItem = (id) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (!existing || existing.qty === 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  };
  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredMenu = search
    ? menu.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
    : menu;

  const groupedMenu = categories.reduce((acc, cat) => {
    acc[cat] = filteredMenu.filter(i => i.category === cat);
    return acc;
  }, {});

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-stone-400 text-sm">Loading menu…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-500">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Restaurant Hero */}
      <div className="bg-white">
        <div className="h-40 bg-gradient-to-br from-orange-400 to-red-500 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span className="text-8xl">🍽️</span>
          </div>
          <div className="absolute top-4 left-4">
            <span className="bg-white/20 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {orderType === 'DELIVERY' ? '🚴 Delivery' : '🛖 Takeaway'}
            </span>
          </div>
        </div>
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-stone-900">{restaurant?.name}</h1>
          <p className="text-stone-500 text-sm mt-0.5">{restaurant?.tagline}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-stone-500">
            <span className="flex items-center gap-1">
              <FiStar size={13} className="text-amber-400 fill-amber-400" />
              {restaurant?.rating}
            </span>
            <span className="text-stone-300">|</span>
            <span className="flex items-center gap-1">
              <FiClock size={13} />
              {restaurant?.delivery_time}
            </span>
            <span className="text-stone-300">|</span>
            <span className="flex items-center gap-1">
              <FiMapPin size={13} />
              {restaurant?.address?.split(',')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-4 py-2.5">
        <div className="flex items-center gap-3 bg-stone-100 rounded-xl px-3.5 py-2.5">
          <FiSearch size={16} className="text-stone-400" />
          <input
            type="text"
            placeholder="Search menu…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent flex-1 text-sm text-stone-700 outline-none placeholder-stone-400"
          />
        </div>
      </div>

      {/* Category Pills (hidden when searching) */}
      {!search && (
        <div className="sticky top-[57px] z-20 bg-white border-b border-stone-100">
          <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? 'bg-brand-orange text-white border-brand-orange'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-brand-orange hover:text-brand-orange'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Sections */}
      <div className="pb-28">
        {search ? (
          <div className="bg-white mx-4 mt-3 rounded-xl px-4">
            <p className="text-xs text-stone-400 pt-3 pb-1">{filteredMenu.length} results</p>
            {filteredMenu.map(item => (
              <MenuItemCard key={item.id} item={item} qty={getQty(item.id)} onAdd={addItem} onRemove={removeItem} />
            ))}
            {filteredMenu.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-stone-400 text-sm">No items found for "{search}"</p>
              </div>
            )}
          </div>
        ) : (
          categories.map(cat => (
            groupedMenu[cat].length > 0 && (
              <div key={cat} ref={el => categoryRefs.current[cat] = el} className="mt-3">
                <div className="px-4 py-2">
                  <h2 className="font-bold text-stone-700 text-base">{cat}</h2>
                  <p className="text-xs text-stone-400">{groupedMenu[cat].length} items</p>
                </div>
                <div className="bg-white mx-4 rounded-xl px-4">
                  {groupedMenu[cat].map(item => (
                    <MenuItemCard key={item.id} item={item} qty={getQty(item.id)} onAdd={addItem} onRemove={removeItem} />
                  ))}
                </div>
              </div>
            )
          ))
        )}
      </div>

      {/* Floating Cart Bar */}
      <FloatingCartBar cart={cart} onClick={() => setCartOpen(true)} />

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onAdd={addItem}
        onRemove={removeItem}
        onCheckout={() => {
          setCartOpen(false);
          window.location.href = `/checkout?r=${restaurantId}&t=${orderType}`;
        }}
      />
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrderPageInner />
    </Suspense>
  );
}
