import { useEffect, useState } from 'react';
import { api, fmt } from '../api';

/**
 * Admin control panel (لوحة التحكم):
 *  - Shift summary: paid revenue, pending revenue, active tables, customer counts.
 *  - Global menu editor: edit prices/names, add and delete items.
 *  - "Reset Shift": wipes all tables/customers/orders for a fresh day.
 *
 * Stats are fetched on mount and after a reset; the menu editor refreshes the
 * shared menu (so the quick-select grid updates too) via `reloadMenu`.
 */
export default function AdminPanel({ menu, reloadMenu, reloadTables }) {
  const [stats, setStats] = useState(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  async function loadStats() {
    try { setStats(await api.getStats()); } catch (e) { console.error(e); }
  }
  useEffect(() => { loadStats(); }, []);

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
  async function resetShift() {
    if (!confirm('سيتم مسح كل الطاولات والطلبات لبدء وردية جديدة. متأكد؟')) return;
    await api.resetShift();
    await reloadTables();
    await loadStats();
    alert('تمت تصفية الوردية ✅');
  }

  return (
    <div className="space-y-5">
      {/* Shift summary */}
      <section>
        <h2 className="font-extrabold mb-2">ملخص الوردية</h2>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="إجمالي المدفوع" value={fmt(stats?.totalRevenue)} accent />
          <Stat label="متبقي (غير مدفوع)" value={fmt(stats?.pendingRevenue)} />
          <Stat label="الطاولات النشطة" value={stats?.activeTables ?? '—'} />
          <Stat label="زبائن مدفوعون" value={`${stats?.paidCustomers ?? 0} / ${stats?.totalCustomers ?? 0}`} />
        </div>
        <button
          onClick={loadStats}
          className="mt-2 text-xs text-coffee-muted underline underline-offset-4"
        >
          تحديث الأرقام
        </button>
      </section>

      {/* Menu editor */}
      <section>
        <h2 className="font-extrabold mb-2">قائمة الأسعار</h2>
        <div className="space-y-2">
          {menu.map((m) => (
            <MenuRow key={m._id} item={m} onSave={saveItem} onDelete={deleteItem} />
          ))}
        </div>

        {/* Add new menu item */}
        <div className="flex gap-2 mt-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="صنف جديد"
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

      {/* Reset shift */}
      <section className="pt-2">
        <button
          onClick={resetShift}
          className="w-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-200
                     font-bold rounded-xl py-3 active:scale-95 transition"
        >
          🔄 تصفية الوردية (مسح كل الطاولات)
        </button>
        <p className="text-[11px] text-coffee-muted mt-1 text-center">القائمة والأسعار لا تتأثر بالتصفية.</p>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="bg-coffee-card border border-coffee-line rounded-xl p-3">
      <p className="text-[11px] text-coffee-muted">{label}</p>
      <p className={`text-lg font-extrabold ${accent ? 'text-coffee-gold' : 'text-coffee-cream'}`}>{value}</p>
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
