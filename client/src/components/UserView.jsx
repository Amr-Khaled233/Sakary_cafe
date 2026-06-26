import { useEffect, useState, useCallback } from 'react';
import { api, fmt } from '../api';
import CustomerCard from './CustomerCard';

/**
 * The restricted User experience.
 *
 * Flow:
 *   1. No session yet -> show a setup screen: pick a table + type your name.
 *      Creating it POSTs a customer and saves { customerId, tableId, ... } to
 *      localStorage so the same person resumes after a refresh.
 *   2. With a session -> fetch ONLY that one customer (GET /api/customers/:id)
 *      and show their own card. They can add/adjust/remove their OWN drinks.
 *      They never see or touch anyone else's orders.
 *
 * A User can never see other customers, other tables' contents, prices admin,
 * or the café total — by construction (we only ever fetch their single record).
 */
const SESSION_KEY = 'cafe_user_session';

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}

export default function UserView({ menu }) {
  const [session, setSession] = useState(loadSession);
  const [tables, setTables] = useState([]);     // [{ _id, tableName }]
  const [tableId, setTableId] = useState('');
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Load the list of tables for the picker (only when setting up).
  useEffect(() => {
    if (!session) api.getTableNames().then(setTables).catch((e) => setError(e.message));
  }, [session]);

  // Fetch this user's own customer record.
  const reloadCustomer = useCallback(async () => {
    if (!session) return;
    try {
      const c = await api.getCustomer(session.customerId);
      setCustomer(c);
      // Keep the saved session name in sync if the user renamed themselves.
      if (c.customerName && c.customerName !== session.customerName) {
        const s = { ...session, customerName: c.customerName };
        localStorage.setItem(SESSION_KEY, JSON.stringify(s));
        setSession(s);
      }
    } catch (e) {
      // Admin deleted this customer (or the shift was reset) -> drop the session.
      if (String(e.message).includes('غير موجود')) clearSession();
      else setError(e.message);
    }
  }, [session]);

  useEffect(() => { reloadCustomer(); }, [reloadCustomer]);

  // Light auto-refresh so the user sees admin changes (e.g. marked as paid) soon.
  useEffect(() => {
    if (!session) return;
    const id = setInterval(reloadCustomer, 20000);
    return () => clearInterval(id);
  }, [session, reloadCustomer]);

  async function startSession(e) {
    e.preventDefault();
    if (!tableId) return setError('اختر الطاولة');
    if (!name.trim()) return setError('اكتب اسمك');
    setBusy(true); setError('');
    try {
      const c = await api.addCustomer(tableId, name.trim());
      const tableName = tables.find((t) => t._id === tableId)?.tableName || '';
      const s = { customerId: c._id, tableId, tableName, customerName: c.customerName };
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSession(s);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  // Clear local session only (used when the customer is already gone server-side).
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setCustomer(null);
    setName(''); setTableId('');
  }

  // Leave the table: delete this user's own customer (so it disappears from the
  // admin view too), then go back to the setup screen. Confirms if they have orders.
  async function leaveTable() {
    const hasOrders = customer && customer.orders && customer.orders.length > 0;
    const msg = hasOrders
      ? 'هتخرج من الطاولة وكل طلباتك هتتمسح. متأكد؟'
      : 'خروج من الطاولة؟';
    if (!confirm(msg)) return;
    try {
      if (session) await api.deleteCustomer(session.customerId);
    } catch (e) {
      // If it was already removed, that's fine — we still clear locally.
      if (!String(e.message).includes('غير موجود')) { setError(e.message); return; }
    }
    clearSession();
  }

  /* ----------------------------- Setup screen ----------------------------- */
  if (!session) {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="font-extrabold text-lg mb-1">أهلاً بيك ☕</h2>
        <p className="text-coffee-muted text-sm mb-4">اختر طاولتك واكتب اسمك علشان تبدأ تطلب.</p>

        {error && (
          <div className="mb-3 bg-red-500/15 border border-red-500/40 text-red-200 text-sm rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={startSession} className="space-y-3">
          {/* Table picker */}
          <div>
            <p className="text-sm font-bold mb-2">الطاولة</p>
            {tables.length === 0 ? (
              <p className="text-coffee-muted text-sm bg-coffee-card border border-coffee-line rounded-xl p-3">
                لا توجد طاولات متاحة حالياً. كلّم المسؤول علشان يضيف طاولة.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {tables.map((t) => (
                  <button
                    type="button"
                    key={t._id}
                    onClick={() => setTableId(t._id)}
                    className={`rounded-xl p-3 font-bold border text-right active:scale-95 transition ${
                      tableId === t._id
                        ? 'bg-coffee-gold text-coffee-bg border-coffee-gold'
                        : 'bg-coffee-card text-coffee-cream border-coffee-line'
                    }`}
                  >
                    {t.tableName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <p className="text-sm font-bold mb-2">اسمك</p>
            <input
              name="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك"
              className="w-full bg-coffee-card border border-coffee-line rounded-xl px-4 py-3
                         placeholder:text-coffee-muted/60 focus:outline-none focus:border-coffee-gold"
            />
          </div>

          <button
            type="submit"
            disabled={busy || tables.length === 0}
            className="w-full bg-coffee-gold hover:bg-coffee-gold2 text-coffee-bg font-extrabold
                       rounded-xl py-3 active:scale-95 transition disabled:opacity-60"
          >
            {busy ? '...' : 'ابدأ الطلب'}
          </button>
        </form>
      </div>
    );
  }

  /* --------------------------- Their own card --------------------------- */
  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-coffee-muted">طاولتك</p>
          <p className="font-extrabold text-coffee-gold">{session.tableName || '—'}</p>
        </div>
        <button
          onClick={leaveTable}
          className="text-xs bg-red-500/15 border border-red-500/40 text-red-200 rounded-lg px-3 py-2 active:scale-95"
        >
          🚪 خروج من الطاولة
        </button>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/40 text-red-200 text-sm rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {customer ? (
        <CustomerCard customer={customer} menu={menu} reload={reloadCustomer} admin={false} owner />
      ) : (
        <p className="text-center text-coffee-muted py-10 text-sm">جارٍ التحميل…</p>
      )}
    </div>
  );
}
