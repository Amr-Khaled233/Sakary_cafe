import { useState } from 'react';
import { api, fmt } from '../api';
import CustomerCard from './CustomerCard';

/**
 * A collapsible table card (accordion). The open/closed state is purely local UI
 * state — it doesn't need to live on the server. Inside it renders the table's
 * CustomerCards plus actions to add a customer or delete the whole table.
 */
export default function TableAccordion({ table, menu, reload, admin }) {
  const [open, setOpen] = useState(true);

  async function addCustomer() {
    const name = `زبون ${table.customers.length + 1}`;
    await api.addCustomer(table._id, name);
    await reload();
  }

  async function renameTable(value) {
    const name = value.trim();
    if (!name || name === table.tableName) return; // nothing changed
    await api.renameTable(table._id, name);
    await reload();
  }

  async function deleteTable() {
    if (!confirm(`حذف "${table.tableName}" بكل بياناتها؟`)) return;
    await api.deleteTable(table._id);
    await reload();
  }

  // Empty the table (remove its customers + orders) but keep the table itself.
  async function resetTable() {
    if (table.customers.length === 0) return;
    if (!confirm(`تصفير "${table.tableName}"؟ كل الزبائن والطلبات هتتمسح والطاولة هتفضل فاضية.`)) return;
    await api.resetTable(table._id);
    await reload();
  }

  return (
    <section className="bg-coffee-card border border-coffee-line rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      {/* Accordion header */}
      <div className="flex items-center gap-3 p-3 cursor-pointer select-none" onClick={() => setOpen((o) => !o)}>
        {/* Clear, big, tappable open/close chevron */}
        <span
          className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-full border text-lg
                      transition-transform duration-200 ${
                        open
                          ? 'rotate-180 bg-coffee-gold text-coffee-bg border-coffee-gold'
                          : 'bg-coffee-card2 text-coffee-gold border-coffee-line'
                      }`}
        >
          ⌄
        </span>
        <div className="flex-1 min-w-0">
          {/* Editable table name for Admin; read-only text for User. */}
          {admin ? (
            <input
              defaultValue={table.tableName}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => renameTable(e.target.value)}
              className="w-full bg-transparent font-extrabold text-base focus:outline-none
                         focus:bg-coffee-card2 rounded px-1 -mx-1"
            />
          ) : (
            <p className="font-extrabold text-base truncate px-1">{table.tableName}</p>
          )}
          <p className="text-[11px] text-coffee-muted px-1">
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
                <CustomerCard key={c._id} customer={c} menu={menu} reload={reload} admin={admin} />
              ))
            )}
          </div>

          <div className="flex gap-2 mt-3">
            {/* Both roles can add a customer (a User adds themselves by name). */}
            <button
              onClick={addCustomer}
              className="flex-1 bg-coffee-gold/15 hover:bg-coffee-gold/25 border border-coffee-gold/40
                         text-coffee-gold font-bold rounded-xl py-3 active:scale-95 transition"
            >
              + إضافة زبون
            </button>
            {/* Reset (empty) and delete are Admin only. */}
            {admin && (
              <button
                onClick={resetTable}
                className="px-4 bg-coffee-card2 hover:bg-coffee-line border border-coffee-line
                           text-coffee-cream rounded-xl py-3 active:scale-95 transition"
              >
                ♻️ تصفير
              </button>
            )}
            {admin && (
              <button
                onClick={deleteTable}
                className="px-4 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40
                           text-red-300 rounded-xl py-3 active:scale-95 transition"
              >
                🗑 حذف
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
