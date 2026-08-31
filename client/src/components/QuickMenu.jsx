import { useState, useRef } from 'react';
import { api, sortMenu } from '../api';

/**
 * Bottom-sheet for adding drinks to ONE customer.
 * - A grid of large quick-select buttons built from the global `menu`.
 * - An inline custom-item form (name + price) for off-menu drinks.
 *
 * Feedback: after each add we show a green "✓ تمت إضافة …" banner, flash the
 * tapped button green, and keep a per-drink count badge (✓ N) so the user can
 * clearly see what — and how many — they've added. The sheet stays open so they
 * can tap several quickly.
 */
export default function QuickMenu({ customerId, menu, onClose, reload }) {
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [counts, setCounts] = useState({});   // key -> how many added this session
  const [flash, setFlash] = useState(null);   // { key, name } just added
  const [query, setQuery] = useState('');     // search filter
  const timer = useRef();

  const keyOf = (name, price) => `${name}__${price}`;

  // Alphabetical menu filtered by the search box.
  const shown = sortMenu(menu).filter((m) => m.name.includes(query.trim()));

  async function add(itemName, price) {
    await api.addOrder({ customerId, itemName, price, quantity: 1 });
    const key = keyOf(itemName, price);
    setCounts((c) => ({ ...c, [key]: (c[key] || 0) + 1 }));
    setFlash({ key, name: itemName });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(null), 1200);
    await reload();
  }

  async function addCustom() {
    const price = parseFloat(customPrice);
    if (!customName.trim()) return alert('اكتب اسم الصنف');
    if (isNaN(price) || price < 0) return alert('اكتب سعراً صحيحاً');
    await add(customName.trim(), price);
    setCustomName('');
    setCustomPrice('');
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-w-2xl mx-auto bg-coffee-card border-t border-coffee-line
                      rounded-t-3xl p-4 pb-6 max-h-[85vh] overflow-y-auto">
        {/* Sticky header + search so it stays visible while scrolling the list */}
        <div className="sticky top-0 z-10 bg-coffee-card -mx-4 px-4 pt-1 pb-2 mb-2 border-b border-coffee-line">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-lg">اختر المشروب</h3>
            <button onClick={onClose} className="text-coffee-muted text-2xl leading-none px-2">✕</button>
          </div>
          <div className="relative">
            <input
              name="menu-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 ابحث عن مشروب..."
              className="w-full bg-coffee-card2 border border-coffee-line rounded-xl px-3 py-2.5 text-base
                         placeholder:text-coffee-muted/60 focus:outline-none focus:border-coffee-gold"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-coffee-muted text-lg"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* "Added" confirmation banner */}
        {flash && (
          <div className="mb-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300
                          text-sm font-extrabold rounded-xl px-3 py-2 text-center">
            ✓ تمت إضافة {flash.name}
          </div>
        )}

        {/* Quick-select grid: fat-finger-friendly buttons */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {shown.map((m) => {
            const key = keyOf(m.name, m.price);
            const n = counts[key] || 0;
            const isFlash = flash && flash.key === key;
            return (
              <button
                key={m._id}
                onClick={() => add(m.name, m.price)}
                className={`relative text-right rounded-xl p-3 border active:scale-95 transition ${
                  isFlash
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : 'bg-coffee-card2 border-coffee-line hover:bg-coffee-line'
                }`}
              >
                <span className="block font-bold text-sm leading-tight">{m.name}</span>
                <span className="block text-coffee-gold font-extrabold text-sm mt-1">{m.price} ج</span>

                {/* Count badge: shows how many of this drink were just added */}
                {n > 0 && (
                  <span className="absolute top-2 left-2 flex items-center gap-0.5 bg-emerald-500 text-white
                                   text-[11px] font-extrabold rounded-full px-1.5 py-0.5 shadow">
                    ✓ {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {shown.length === 0 && (
          <p className="text-center text-coffee-muted text-sm py-6">
            لا يوجد مشروب بالاسم "{query}". تقدر تضيفه كصنف مخصص بالأسفل.
          </p>
        )}

        {/* Custom item */}
        <div className="border-t border-coffee-line pt-3">
          <p className="text-sm font-bold mb-2 text-coffee-gold">صنف مخصص (غير موجود بالقائمة)</p>
          <div className="flex gap-2">
            <input
              name="custom-item-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="اسم الصنف"
              className="flex-1 bg-coffee-card2 border border-coffee-line rounded-xl px-3 py-3
                         placeholder:text-coffee-muted/60 focus:outline-none focus:border-coffee-gold"
            />
            <input
              name="custom-item-price"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              type="number"
              inputMode="numeric"
              placeholder="السعر"
              className="w-24 bg-coffee-card2 border border-coffee-line rounded-xl px-3 py-3
                         placeholder:text-coffee-muted/60 focus:outline-none focus:border-coffee-gold"
            />
          </div>
          <button
            onClick={addCustom}
            className="w-full mt-2 bg-coffee-gold hover:bg-coffee-gold2 active:scale-95 transition
                       text-coffee-bg font-extrabold rounded-xl py-3"
          >
            + إضافة الصنف المخصص
          </button>
        </div>
      </div>
    </div>
  );
}
