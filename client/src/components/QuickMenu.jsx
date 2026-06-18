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
  const timer = useRef();

  const keyOf = (name, price) => `${name}__${price}`;

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
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-lg">اختر المشروب</h3>
          <button onClick={onClose} className="text-coffee-muted text-2xl leading-none px-2">✕</button>
        </div>

        {/* "Added" confirmation banner */}
        {flash && (
          <div className="mb-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300
                          text-sm font-extrabold rounded-xl px-3 py-2 text-center">
            ✓ تمت إضافة {flash.name}
          </div>
        )}

        {/* Quick-select grid: fat-finger-friendly buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {sortMenu(menu).map((m) => {
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

        {/* Custom item */}
        <div className="border-t border-coffee-line pt-3">
          <p className="text-sm font-bold mb-2 text-coffee-gold">صنف مخصص (غير موجود بالقائمة)</p>
          <div className="flex gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="اسم الصنف"
              className="flex-1 bg-coffee-card2 border border-coffee-line rounded-xl px-3 py-3
                         placeholder:text-coffee-muted/60 focus:outline-none focus:border-coffee-gold"
            />
            <input
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
