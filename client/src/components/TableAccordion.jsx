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
  const [showWho, setShowWho] = useState(false); // "who paid" panel

  // Payment breakdown for this table (paidAmount already accounts for whole-customer
  // paid AND per-item paid, computed by the backend).
  const total = table.grandTotal;
  const paid = table.customers.reduce((s, c) => s + (c.paidAmount || 0), 0);
  const remaining = Math.max(0, total - paid);
  const allPaid = table.customers.length > 0 && remaining <= 0;

  // Split customers into fully-paid vs not (for the "who paid" list).
  const paidList = table.customers.filter(
    (c) => c.isPaid || (c.finalTotal > 0 && (c.paidAmount || 0) >= c.finalTotal)
  );
  const paidIds = new Set(paidList.map((c) => c._id));
  const unpaidList = table.customers.filter((c) => !paidIds.has(c._id));

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
              name="table-name"
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
        {/* Add-customer button next to the table name. stopPropagation so it
            doesn't toggle the accordion. */}
        <button
          onClick={(e) => { e.stopPropagation(); addCustomer(); }}
          className="shrink-0 bg-coffee-gold/15 hover:bg-coffee-gold/25 border border-coffee-gold/40
                     text-coffee-gold text-xs font-bold rounded-lg px-2.5 py-2 active:scale-95 transition"
        >
          + زبون
        </button>
        {/* "Who paid" toggle — shows which names paid fully vs not. */}
        {table.customers.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowWho((s) => !s); }}
            title="مين دفع؟"
            className={`shrink-0 text-sm rounded-lg px-2.5 py-2 border active:scale-95 transition ${
              showWho ? 'bg-coffee-gold text-coffee-bg border-coffee-gold' : 'bg-coffee-card2 text-coffee-cream border-coffee-line'
            }`}
          >
            🧾
          </button>
        )}
        <div className="text-left shrink-0">
          <p className="text-[10px] text-coffee-muted leading-none">الإجمالي</p>
          <p className="font-extrabold text-coffee-gold">{fmt(total)}</p>
          {table.customers.length > 0 && (
            <p className={`text-[9px] leading-none mt-0.5 ${allPaid ? 'text-emerald-300' : 'text-amber-300'}`}>
              {allPaid ? 'مدفوعة بالكامل ✓' : `باقي ${fmt(remaining)}`}
            </p>
          )}
        </div>
      </div>

      {/* "Who paid" panel (works even when the accordion is collapsed) */}
      {showWho && (
        <div className="px-3 py-3 border-t border-coffee-line bg-coffee-bg/40 space-y-2">
          <div>
            <p className="text-emerald-300 font-bold text-xs mb-1">✅ دفعوا بالكامل ({paidList.length})</p>
            <p className="text-emerald-200/90 text-xs leading-relaxed">
              {paidList.length ? paidList.map((c) => c.customerName).join('، ') : 'لا أحد'}
            </p>
          </div>
          <div>
            <p className="text-amber-300 font-bold text-xs mb-1">⏳ لسه ({unpaidList.length})</p>
            <p className="text-amber-200/90 text-xs leading-relaxed">
              {unpaidList.length
                ? unpaidList
                    .map((c) => c.customerName + ((c.paidAmount || 0) > 0 ? ` (باقي ${fmt(c.finalTotal - c.paidAmount)})` : ''))
                    .join('، ')
                : 'لا أحد'}
            </p>
          </div>
        </div>
      )}

      {/* Accordion body */}
      {open && (
        <div className="px-3 pb-3 border-t border-coffee-line">
          {/* Payment summary: total / paid / remaining */}
          {table.customers.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-coffee-card2 border border-coffee-line rounded-lg py-2">
                <p className="text-[10px] text-coffee-muted">الإجمالي</p>
                <p className="font-extrabold text-coffee-gold text-sm">{fmt(total)}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg py-2">
                <p className="text-[10px] text-emerald-300/80">مدفوع</p>
                <p className="font-extrabold text-emerald-300 text-sm">{fmt(paid)}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg py-2">
                <p className="text-[10px] text-amber-300/80">باقي</p>
                <p className="font-extrabold text-amber-300 text-sm">{fmt(remaining)}</p>
              </div>
            </div>
          )}

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
            {/* Reset (empty) and delete are Admin only. (Add-customer moved to the header.) */}
            {admin && (
              <button
                onClick={resetTable}
                className="flex-1 bg-coffee-card2 hover:bg-coffee-line border border-coffee-line
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
