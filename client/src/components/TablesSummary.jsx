import { fmt } from '../api';

/**
 * Admin-only summary shown at the very bottom of the tables tab.
 * For each table it aggregates how much of every drink was ordered (summed
 * across all that table's customers), with quantity + amount. Then an overall
 * total per drink across all tables. Computed purely from the tables tree —
 * no extra API call.
 */
export default function TablesSummary({ tables }) {
  if (!tables || tables.length === 0) return null;

  // Aggregate per table: drink name -> { qty, amount }
  const perTable = tables.map((t) => {
    const map = new Map();
    for (const c of t.customers) {
      for (const o of c.orders) {
        const cur = map.get(o.itemName) || { qty: 0, amount: 0 };
        cur.qty += o.quantity;
        cur.amount += o.price * o.quantity;
        map.set(o.itemName, cur);
      }
    }
    const items = [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty);
    return { table: t, items };
  });

  // Overall across all tables
  const overall = new Map();
  for (const { items } of perTable) {
    for (const it of items) {
      const cur = overall.get(it.name) || { qty: 0, amount: 0 };
      cur.qty += it.qty;
      cur.amount += it.amount;
      overall.set(it.name, cur);
    }
  }
  const overallItems = [...overall.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty);

  const Row = ({ name, qty, amount }) => (
    <div className="flex items-center justify-between text-sm bg-coffee-card2 rounded-lg px-2 py-1.5">
      <span className="min-w-0 truncate">{name}</span>
      <span className="flex items-center gap-3 shrink-0">
        <span className="font-extrabold">×{qty}</span>
        <span className="text-coffee-gold font-bold w-16 text-left">{fmt(amount)}</span>
      </span>
    </div>
  );

  return (
    <section className="mt-8">
      <h2 className="font-extrabold mb-3 text-coffee-gold">📊 ملخص الطلبات لكل طاولة</h2>

      <div className="space-y-3">
        {perTable.map(({ table, items }) => (
          <div key={table._id} className="bg-coffee-card border border-coffee-line rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-extrabold">{table.tableName}</p>
              <p className="font-extrabold text-coffee-gold">{fmt(table.grandTotal)}</p>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-coffee-muted">لا توجد طلبات.</p>
            ) : (
              <div className="space-y-1">
                {items.map((it) => <Row key={it.name} {...it} />)}
              </div>
            )}
          </div>
        ))}
      </div>

      {overallItems.length > 0 && (
        <div className="bg-coffee-gold/10 border border-coffee-gold/40 rounded-2xl p-3 mt-3">
          <p className="font-extrabold text-coffee-gold mb-2">الإجمالي العام لكل مشروب</p>
          <div className="space-y-1">
            {overallItems.map((it) => <Row key={it.name} {...it} />)}
          </div>
        </div>
      )}
    </section>
  );
}
