import { useState } from 'react';
import { api, fmt } from '../api';
import QuickMenu from './QuickMenu';

/**
 * One customer inside a table: their order list, +/- steppers, a manual
 * final-price override, and the button that opens QuickMenu.
 * `customer` arrives already enriched by the backend with `subtotal`,
 * `finalTotal` and its `orders` array.
 */
export default function CustomerCard({ customer, menu, reload, admin, owner = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasOverride = customer.customOverridePrice !== null && customer.customOverridePrice !== undefined;
  // A User editing their OWN card (owner) can add/adjust/remove their drinks,
  // but only an Admin can rename people, override prices, or delete a customer.
  const canEditOrders = admin || owner;
  const isPaid = !!customer.isPaid;
  const paidAmount = customer.paidAmount || 0;
  const remaining = Math.max(0, customer.finalTotal - paidAmount);
  const partiallyPaid = !isPaid && paidAmount > 0;

  async function togglePaid() {
    await api.togglePaid(customer._id, !isPaid); // Admin only (backend enforces)
    await reload();
  }
  async function toggleOrderPaid(o) {
    await api.toggleOrderPaid(o._id, !o.isPaid); // Admin only
    await reload();
  }
  async function setNote(value) {
    const note = value.trim();
    if (note === (customer.note || '')) return;
    await api.setNote(customer._id, note); // Admin only
    await reload();
  }
  async function renameCustomer(value) {
    const name = value.trim();
    if (!name || name === customer.customerName) return; // nothing changed
    await api.renameCustomer(customer._id, name);
    await reload();
  }
  async function changeQty(orderId, delta) {
    await api.changeQty(orderId, delta);
    await reload();
  }
  async function removeOrder(orderId) {
    await api.deleteOrder(orderId);
    await reload();
  }
  async function setOverride(value) {
    await api.overridePrice(customer._id, value === '' ? null : parseFloat(value));
    await reload();
  }
  async function clearOverride() {
    await api.overridePrice(customer._id, null);
    await reload();
  }
  async function removeCustomer() {
    await api.deleteCustomer(customer._id);
    await reload();
  }

  return (
    <div
      className={`border rounded-xl p-3 transition-colors ${
        isPaid
          ? 'bg-emerald-500/15 border-emerald-500/60'   // paid -> green card
          : 'bg-amber-500/10 border-amber-500/40'        // not paid -> amber card
      }`}
    >
      {/* Header: name + paid badge + subtotal */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-coffee-muted">👤</span>
        {/* Editable name for Admin or the owner (a User editing their own name). */}
        {canEditOrders ? (
          <input
            name="customer-name"
            defaultValue={customer.customerName}
            onBlur={(e) => renameCustomer(e.target.value)}
            className="flex-1 min-w-0 bg-transparent font-bold focus:outline-none focus:bg-coffee-card rounded px-1 -mx-1"
          />
        ) : (
          <span className="flex-1 min-w-0 font-bold truncate">{customer.customerName}</span>
        )}
        {/* Paid status badge — visible to everyone (admin + the user themselves) */}
        <span
          className={`shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border ${
            isPaid
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
          }`}
        >
          {isPaid ? 'مدفوع ✓' : 'لسه'}
        </span>
        <div className="text-left shrink-0">
          <p className="text-[10px] text-coffee-muted leading-none">المطلوب</p>
          <p className={`font-extrabold ${hasOverride ? 'text-coffee-muted line-through text-xs' : 'text-coffee-cream'}`}>
            {fmt(customer.subtotal)}
          </p>
        </div>
        {/* Removing a customer is Admin only. */}
        {admin && (
          <button onClick={removeCustomer} className="text-red-300/70 hover:text-red-300 text-lg px-1 shrink-0">✕</button>
        )}
      </div>

      {/* Order list */}
      <div className="space-y-1.5">
        {customer.orders.length === 0 && <p className="text-xs text-coffee-muted py-1">لا توجد طلبات بعد.</p>}
        {customer.orders.map((o) => {
          const oPaid = !!o.isPaid;
          return (
          <div key={o._id} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${oPaid ? 'bg-emerald-500/20' : 'bg-coffee-card'}`}>
            {/* Per-item paid: Admin toggles; others see a read-only check when paid. */}
            {admin ? (
              <button
                onClick={() => toggleOrderPaid(o)}
                title={oPaid ? 'مدفوع' : 'تحديد كمدفوع'}
                className={`shrink-0 w-6 h-6 rounded-full border text-[11px] flex items-center justify-center ${
                  oPaid ? 'bg-emerald-500 text-white border-emerald-500' : 'border-coffee-line text-coffee-muted'
                }`}
              >✓</button>
            ) : oPaid ? (
              <span className="shrink-0 text-emerald-400 text-sm">✓</span>
            ) : null}

            <span className={`flex-1 min-w-0 truncate text-sm ${oPaid ? 'text-emerald-200' : ''}`}>{o.itemName}</span>

            {/* Quantity: owner/Admin get +/- steppers; otherwise a read-only count (×N). */}
            {canEditOrders ? (
              <div className="flex items-center gap-1 shrink-0 select-none">
                <button
                  onClick={() => changeQty(o._id, -1)}
                  className="w-7 h-7 rounded-lg bg-coffee-card2 border border-coffee-line text-lg font-bold active:scale-90 transition leading-none"
                >−</button>
                <span className="w-5 text-center font-extrabold">{o.quantity}</span>
                <button
                  onClick={() => changeQty(o._id, 1)}
                  className="w-7 h-7 rounded-lg bg-coffee-gold text-coffee-bg text-lg font-bold active:scale-90 transition leading-none"
                >+</button>
              </div>
            ) : (
              <span className="shrink-0 font-extrabold text-sm">×{o.quantity}</span>
            )}

            <span className="w-12 text-left text-xs font-bold text-coffee-gold shrink-0">{fmt(o.price * o.quantity)}</span>
            {/* Owner/Admin can remove a line item. */}
            {canEditOrders && (
              <button onClick={() => removeOrder(o._id)} className="text-red-300/60 hover:text-red-300 text-sm shrink-0">🗑</button>
            )}
          </div>
          );
        })}
      </div>

      {/* Add drink + manual override (owner/Admin only) */}
      {canEditOrders && (
      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={() => setMenuOpen(true)}
          className="flex-1 bg-coffee-gold/15 hover:bg-coffee-gold/25 border border-coffee-gold/40
                     text-coffee-gold text-sm font-bold rounded-lg py-2.5 active:scale-95 transition"
        >
          + مشروب
        </button>
        {/* Manual price override is Admin only. */}
        {admin && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-coffee-muted">سعر يدوي</span>
            <input
              name="override-price"
              type="number"
              inputMode="numeric"
              placeholder="—"
              defaultValue={hasOverride ? customer.customOverridePrice : ''}
              onBlur={(e) => setOverride(e.target.value)}
              className={`w-16 bg-coffee-card border rounded-lg text-center text-sm py-2 focus:outline-none focus:border-coffee-gold ${
                hasOverride ? 'border-coffee-gold' : 'border-coffee-line'
              }`}
            />
          </div>
        )}
      </div>
      )}

      {/* Final total for this person */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-coffee-line/60">
        <span className={`text-xs ${hasOverride ? 'text-coffee-gold' : 'text-coffee-muted'}`}>
          {hasOverride ? 'الإجمالي النهائي (سعر يدوي)' : 'إجمالي الزبون'}
          {hasOverride && admin && <button onClick={clearOverride} className="underline mr-1">إلغاء</button>}
        </span>
        <span className="font-extrabold text-coffee-gold text-lg">{fmt(customer.finalTotal)}</span>
      </div>

      {/* Paid status + Admin toggle (User sees status only) */}
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs font-bold ${isPaid ? 'text-emerald-300' : partiallyPaid ? 'text-amber-300' : 'text-amber-300'}`}>
          {isPaid
            ? '✓ تم الدفع بالكامل'
            : partiallyPaid
              ? `مدفوع ${fmt(paidAmount)} · باقي ${fmt(remaining)}`
              : '⏳ لم يتم الدفع بعد'}
        </span>
        {admin && (
          <button
            onClick={togglePaid}
            className={`text-xs font-bold rounded-lg px-3 py-1.5 border active:scale-95 transition ${
              isPaid
                ? 'bg-coffee-card border-coffee-line text-coffee-muted'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {isPaid ? 'إلغاء الدفع' : 'دفع الكل'}
          </button>
        )}
      </div>

      {/* Note (e.g. "ليه باقي 50") — shown in a distinct color */}
      {admin ? (
        <div className="mt-2 relative">
          <input
            key={`note-${customer.note || ''}`}
            name="customer-note"
            defaultValue={customer.note || ''}
            onBlur={(e) => setNote(e.target.value)}
            placeholder="📝 ملاحظة (مثال: ليه باقي 50)"
            className={`w-full rounded-lg px-3 py-2 pl-8 text-sm border focus:outline-none ${
              customer.note
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-100 placeholder:text-rose-200/50'
                : 'bg-coffee-card border-coffee-line placeholder:text-coffee-muted/60'
            }`}
          />
          {customer.note && (
            <button
              onClick={() => setNote('')}
              title="مسح الملاحظة"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-rose-200/80 hover:text-rose-100"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        customer.note && (
          <div className="mt-2 bg-rose-500/20 border border-rose-500/50 text-rose-100 rounded-lg px-3 py-2 text-sm font-bold">
            📝 {customer.note}
          </div>
        )
      )}

      {menuOpen && (
        <QuickMenu customerId={customer._id} menu={menu} reload={reload} onClose={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
