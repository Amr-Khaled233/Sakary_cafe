import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmt } from '../api';
import { isAdmin, logout } from '../auth';
import TableAccordion from '../components/TableAccordion';
import CustomerCard from '../components/CustomerCard';
import AdminPanel from '../components/AdminPanel';
import UserView from '../components/UserView';
import TablesSummary from '../components/TablesSummary';

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
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Admin name-search: flatten matching customers across all tables.
  const q = search.trim();
  const matches = q
    ? tables.flatMap((t) =>
        t.customers
          .filter((c) => c.customerName && c.customerName.includes(q))
          .map((c) => ({ table: t, customer: c })))
    : [];

  const reloadTables = useCallback(async () => {
    try { setTables(await api.getTables()); }
    catch (e) { setError(e.message); }
  }, []);
  const reloadMenu = useCallback(async () => {
    try { setMenu(await api.getMenu()); }
    catch (e) { setError(e.message); }
  }, []);

  // Admins load the whole tree; Users never do (UserView fetches only their own
  // record). Both need the menu for the quick-select list.
  useEffect(() => {
    if (admin) reloadTables();
    reloadMenu();
  }, [admin, reloadTables, reloadMenu]);

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
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">☕</span>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold leading-none">حساب القهوة</h1>
              <p className="text-[11px] text-coffee-muted mt-0.5">{admin ? 'مسؤول' : 'مستخدم'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Café total is for Admins only */}
            {admin && (
              <div className="text-left">
                <p className="text-[10px] text-coffee-muted leading-none">إجمالي الكافيه</p>
                <p className="text-lg font-extrabold text-coffee-gold leading-tight">{fmt(cafeTotal)}</p>
              </div>
            )}
            {/* Clear, visible logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm font-bold bg-coffee-card border border-coffee-line
                         text-coffee-cream rounded-xl px-3 py-2 active:scale-95 transition"
            >
              <span>خروج</span><span aria-hidden>⎋</span>
            </button>
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

        {!admin ? (
          /* USER: restricted view — pick a table, enter name, manage only own drinks */
          <UserView menu={menu} />
        ) : tab === 'admin' ? (
          <AdminPanel menu={menu} reloadMenu={reloadMenu} reloadTables={reloadTables} />
        ) : (
          <>
            {/* Search a customer by name */}
            <div className="relative mb-4">
              <input
                name="customer-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 ابحث باسم الزبون..."
                className="w-full bg-coffee-card border border-coffee-line rounded-xl px-4 py-3 text-base
                           placeholder:text-coffee-muted/60 focus:outline-none focus:border-coffee-gold"
              />
              {q && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-muted text-lg"
                >
                  ✕
                </button>
              )}
            </div>

            {q ? (
              /* ---- Search results: matching customers across all tables ---- */
              <div className="space-y-3">
                {matches.length === 0 ? (
                  <p className="text-center text-coffee-muted py-10">لا يوجد زبون بالاسم "{q}".</p>
                ) : (
                  matches.map(({ table, customer }) => (
                    <div key={customer._id}>
                      <p className="text-[11px] text-coffee-muted mb-1">طاولة: {table.tableName}</p>
                      <CustomerCard customer={customer} menu={menu} reload={reloadTables} admin />
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Add table */}
                <form onSubmit={handleAddTable} className="flex gap-2 mb-4">
                  <input
                    name="new-table-name"
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

                <div className="space-y-3">
                  {tables.map((table) => (
                    <TableAccordion key={table._id} table={table} menu={menu} reload={reloadTables} admin={admin} />
                  ))}
                </div>

                {tables.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-3">🪑</div>
                    <p className="text-coffee-muted">لا توجد طاولات نشطة. أضف أول طاولة للبدء.</p>
                  </div>
                )}

                {/* Per-table drink breakdown at the very bottom */}
                <TablesSummary tables={tables} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
