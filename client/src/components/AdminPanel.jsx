import { useState } from 'react';
import { api, sortMenu } from '../api';

/**
 * Admin control panel (لوحة التحكم) — menu only.
 * Shows the drinks and their prices, lets you edit a name/price, add a new drink,
 * or delete one. Changes refresh the shared menu so the quick-select grid updates.
 */
export default function AdminPanel({ menu, reloadMenu, reloadTables }) {
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  async function saveItem(id, name, price) {
    await api.updateMenuItem(id, { name, price: parseFloat(price) });
    await reloadMenu();
    await reloadTables();
  }
  async function addItem() {
    const price = parseFloat(newPrice);
    if (!newName.trim() || isNaN(price)) return alert('اكتب اسم وسعر صحيح');
    await api.addMenuItem({ name: newName.trim(), price });
    setNewName(''); setNewPrice('');
    await reloadMenu();
  }
  async function deleteItem(id) {
    if (!confirm('حذف الصنف من القائمة؟')) return;
    await api.deleteMenuItem(id);
    await reloadMenu();
  }
  // Add/subtract a fixed amount to EVERY drink at once (e.g. +5 then -5 to revert).
  async function adjustAll(delta) {
    await api.adjustMenu(delta);
    await reloadMenu();
    await reloadTables();
  }

  return (
    <div className="space-y-5">
      <section>
        <h2 className="font-extrabold mb-2">قائمة المشروبات والأسعار</h2>

        {/* Bulk price adjust: +5 to all / -5 to all (to revert) */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => adjustAll(5)}
            className="flex-1 bg-coffee-gold/15 border border-coffee-gold/40 text-coffee-gold font-bold
                       rounded-xl py-2.5 active:scale-95 transition"
          >
            +5 ج لكل المشروبات
          </button>
          <button
            onClick={() => adjustAll(-5)}
            className="flex-1 bg-coffee-card border border-coffee-line text-coffee-cream font-bold
                       rounded-xl py-2.5 active:scale-95 transition"
          >
            −5 ج لكل المشروبات
          </button>
        </div>

        <div className="space-y-2">
          {sortMenu(menu).map((m) => (
            // Key includes price/name so an external change (e.g. bulk +5/-5) remounts
            // the row with fresh values; local typing doesn't change the key.
            <MenuRow key={`${m._id}-${m.price}-${m.name}`} item={m} onSave={saveItem} onDelete={deleteItem} />
          ))}
        </div>

        {/* Add new menu item */}
        <div className="flex gap-2 mt-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="مشروب جديد"
            className="flex-1 bg-coffee-card border border-coffee-line rounded-xl px-3 py-2.5
                       placeholder:text-coffee-muted/60 focus:outline-none focus:border-coffee-gold"
          />
          <input
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            type="number"
            inputMode="numeric"
            placeholder="السعر"
            className="w-24 bg-coffee-card border border-coffee-line rounded-xl px-3 py-2.5
                       placeholder:text-coffee-muted/60 focus:outline-none focus:border-coffee-gold"
          />
          <button
            onClick={addItem}
            className="bg-coffee-gold text-coffee-bg font-extrabold rounded-xl px-4 active:scale-95 transition"
          >
            +
          </button>
        </div>
      </section>
    </div>
  );
}

// A single editable menu row (local draft state, saved on button click).
function MenuRow({ item, onSave, onDelete }) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price);
  const dirty = name !== item.name || Number(price) !== item.price;

  return (
    <div className="flex items-center gap-2 bg-coffee-card border border-coffee-line rounded-xl px-2 py-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        type="number"
        inputMode="numeric"
        className="w-16 bg-coffee-card2 border border-coffee-line rounded-lg text-center text-sm py-1.5 focus:outline-none focus:border-coffee-gold"
      />
      <button
        disabled={!dirty}
        onClick={() => onSave(item._id, name, price)}
        className={`text-xs font-bold rounded-lg px-3 py-1.5 transition ${
          dirty ? 'bg-coffee-gold text-coffee-bg active:scale-95' : 'bg-coffee-card2 text-coffee-muted'
        }`}
      >
        حفظ
      </button>
      <button onClick={() => onDelete(item._id)} className="text-red-300/70 hover:text-red-300 px-1">🗑</button>
    </div>
  );
}
