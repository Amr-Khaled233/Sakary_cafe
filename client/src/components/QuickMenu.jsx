import { useState } from 'react';
import { api } from '../api';

/**
 * Bottom-sheet for adding drinks to ONE customer.
 * - A grid of large quick-select buttons built from the global `menu`.
 * - An inline custom-item form (name + price) for off-menu drinks.
 * After each add we call `reload()` so totals refresh; the sheet stays open so
 * the user can tap several drinks quickly for the same person.
 */
export default function QuickMenu({ customerId, menu, onClose, reload }) {
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  async function add(itemName, price) {
    await api.addOrder({ customerId, itemName, price, quantity: 1 });
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

        {/* Quick-select grid: fat-finger-friendly buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {menu.map((m) => (
            <button
              key={m._id}
              onClick={() => add(m.name, m.price)}
              className="text-right bg-coffee-card2 hover:bg-coffee-line active:scale-95 transition
                         border border-coffee-line rounded-xl p-3"
            >
              <span className="block font-bold text-sm leading-tight">{m.name}</span>
              <span className="block text-coffee-gold font-extrabold text-sm mt-1">{m.price} ج</span>
            </button>
          ))}
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
