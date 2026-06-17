import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmt } from '../api';
import { isAdmin, getRole, logout } from '../auth';
import TableAccordion from '../components/TableAccordion';
import AdminPanel from '../components/AdminPanel';

/**
 * Main app (after login). Same data flow as before — the backend tree is the
 * source of truth and every mutation calls api.* then reload(). What's new:
 *   - `admin` (from the JWT role) gates the UI: Admins get full controls + the
 *     control-panel tab; Users get a read-only-ish view where they can only add
 *     a customer (their name) and add drinks.
 *   - A logout button clears the token and returns to the landing page.
 * The backend enforces the same rules, so the UI gating is convenience, not security.
 */
export default function CafeApp() {
  const navigate = useNavigate();
  const admin = isAdmin();

  const [tab, setTab] = useState('tables'); // 'tables' | 'admin'
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [newTableName, setNewTableName] = useState('');
  const [error, setError] = useState('');

  const reloadTables = useCallback(async () => {
    try { setTables(await api.getTables()); }
    catch (e) { setError(e.message); }
  }, []);
  const reloadMenu = useCallback(async () => {
    try { setMenu(await api.getMenu()); }
    catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { reloadTables(); reloadMenu(); }, [reloadTables, reloadMenu]);

  const cafeTotal = tables.reduce((sum, t) => sum + t.grandTotal, 0);

  async function handleAddTable(e) {
    e.preventDefault();
    const name = newTableName.trim() || `طاولة ${tables.length + 1}`;
    setNewTableName('');
    try { await api.addTable(name); await reloadTables(); }
    catch (err) { setError(err.message); }
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen text-coffee-cream pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-coffee-bg/95 backdrop-blur border-b border-coffee-line">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☕</span>
            <div>
              <h1 className="text-lg font-extrabold leading-none">حساب القهوة</h1>
              <p className="text-[11px] text-coffee-muted mt-0.5">
                {admin ? 'مسؤول' : 'مستخدم'} · <button onClick={handleLogout} className="underline">خروج</button>
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-coffee-muted leading-none">إجمالي الكافيه</p>
            <p className="text-xl font-extrabold text-coffee-gold leading-tight">{fmt(cafeTotal)}</p>
          </div>
        </div>

        {/* Tabs — the control-panel tab only exists for Admins */}
        {admin && (
          <div className="max-w-2xl mx-auto px-4 flex gap-2">
            {[
              { id: 'tables', label: 'الطاولات' },
              { id: 'admin', label: 'لوحة التحكم' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition ${
                  tab === t.id ? 'border-coffee-gold text-coffee-gold' : 'border-transparent text-coffee-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 pt-4">
        {error && (
          <div className="mb-3 bg-red-500/15 border border-red-500/40 text-red-200 text-sm rounded-xl px-3 py-2 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {admin && tab === 'admin' ? (
          <AdminPanel menu={menu} reloadMenu={reloadMenu} reloadTables={reloadTables} />
        ) : (
          <>
            {/* Add table — Admin only */}
            {admin && (
              <form onSubmit={handleAddTable} className="flex gap-2 mb-4">
                <input
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="اسم الطاولة (مثال: طاولة العيلة)"
                  className="flex-1 bg-coffee-card border border-coffee-line rounded-xl px-4 py-3 text-base
                             placeholder:text-coffee-muted/60 focus:outline-none focus:border-coffee-gold"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-coffee-gold hover:bg-coffee-gold2 active:scale-95 transition
                             text-coffee-bg font-extrabold rounded-xl px-5 py-3 text-base"
                >
                  + طاولة
                </button>
              </form>
            )}

            <div className="space-y-3">
              {tables.map((table) => (
                <TableAccordion key={table._id} table={table} menu={menu} reload={reloadTables} admin={admin} />
              ))}
            </div>

            {tables.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-3">🪑</div>
                <p className="text-coffee-muted">
                  {admin ? 'لا توجد طاولات نشطة. أضف أول طاولة للبدء.' : 'لا توجد طاولات حالياً.'}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
