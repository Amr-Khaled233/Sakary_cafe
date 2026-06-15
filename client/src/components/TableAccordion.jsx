import { useState } from 'react';
import { api, fmt } from '../api';
import CustomerCard from './CustomerCard';

/**
 * A collapsible table card (accordion). The open/closed state is purely local UI
 * state — it doesn't need to live on the server. Inside it renders the table's
 * CustomerCards plus actions to add a customer or delete the whole table.
 */
export default function TableAccordion({ table, menu, reload }) {
  const [open, setOpen] = useState(true);

  async function addCustomer() {
    const name = `زبون ${table.customers.length + 1}`;
    await api.addCustomer(table._id, name);
    await reload();
  }

  async function deleteTable() {
    if (!confirm(`حذف "${table.tableName}" بكل بياناتها؟`)) return;
    await api.deleteTable(table._id);
    await reload();
  }

  return (
    <section className="bg-coffee-card border border-coffee-line rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      {/* Accordion header */}
      <div className="flex items-center gap-2 p-3 cursor-pointer select-none" onClick={() => setOpen((o) => !o)}>
        <span className={`text-coffee-gold text-lg transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-base truncate">{table.tableName}</p>
          <p className="text-[11px] text-coffee-muted">
            {table.customers.length} {table.customers.length === 1 ? 'زبون' : 'زبائن'}
          </p>
        </div>
        <div className="text-left shrink-0">
          <p className="text-[10px] text-coffee-muted leading-none">الإجمالي</p>
          <p className="font-extrabold text-coffee-gold">{fmt(table.grandTotal)}</p>
        </div>
      </div>

      {/* Accordion body */}
      {open && (
        <div className="px-3 pb-3 border-t border-coffee-line">
          <div className="space-y-3 mt-3">
            {table.customers.length === 0 ? (
              <p className="text-center text-sm text-coffee-muted py-4">لا يوجد زبائن. أضف أول زبون.</p>
            ) : (
              table.customers.map((c) => (
                <CustomerCard key={c._id} customer={c} menu={menu} reload={reload} />
              ))
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={addCustomer}
              className="flex-1 bg-coffee-gold/15 hover:bg-coffee-gold/25 border border-coffee-gold/40
                         text-coffee-gold font-bold rounded-xl py-3 active:scale-95 transition"
            >
              + إضافة زبون
            </button>
            <button
              onClick={deleteTable}
              className="px-4 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40
                         text-red-300 rounded-xl py-3 active:scale-95 transition"
            >
              🗑 حذف
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
