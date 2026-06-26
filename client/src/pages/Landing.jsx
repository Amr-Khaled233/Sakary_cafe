import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { setAuth, isAuthed } from '../auth';

/**
 * Role-selection landing page (صفحة اختيار الدخول).
 *  - "Admin": reveals a password field -> POST /api/auth/admin-login -> Admin token.
 *  - "User": logs in instantly (no password) -> User token -> tables view.
 */
export default function Landing() {
  const navigate = useNavigate();
  const [showAdmin, setShowAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already logged in (e.g. after a refresh)? Skip the landing page.
  useEffect(() => {
    if (isAuthed()) navigate('/app', { replace: true });
  }, [navigate]);

  async function adminLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token, role } = await api.adminLogin(password);
      setAuth(token, role);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'كلمة المرور غير صحيحة');
    } finally {
      setBusy(false);
    }
  }

  async function userLogin() {
    setBusy(true);
    setError('');
    try {
      const { token, role } = await api.userLogin();
      setAuth(token, role);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'تعذّر الدخول');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-coffee-cream">
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-2">☕</div>
        <h1 className="text-2xl font-extrabold">حساب القهوة</h1>
        <p className="text-coffee-muted text-sm mt-1">اختر طريقة الدخول</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {/* User: instant entry */}
        <button
          onClick={userLogin}
          disabled={busy}
          className="w-full bg-coffee-card border border-coffee-line rounded-2xl p-4 text-right
                     active:scale-95 transition disabled:opacity-60"
        >
          <p className="font-extrabold text-lg">الدخول كـ مستخدم / عميل</p>
          <p className="text-coffee-muted text-xs mt-1">دخول مباشر — تشوف الطاولات وتضيف طلباتك بس</p>
        </button>

        {/* Admin: reveal password */}
        {!showAdmin ? (
          <button
            onClick={() => { setShowAdmin(true); setError(''); }}
            disabled={busy}
            className="w-full bg-coffee-gold/15 border border-coffee-gold/40 rounded-2xl p-4 text-right
                       active:scale-95 transition disabled:opacity-60"
          >
            <p className="font-extrabold text-lg text-coffee-gold">الدخول كـ مسؤول (Admin)</p>
            <p className="text-coffee-muted text-xs mt-1">تحكم كامل: الطاولات، الأسعار، والإدارة</p>
          </button>
        ) : (
          <form onSubmit={adminLogin} className="bg-coffee-gold/10 border border-coffee-gold/40 rounded-2xl p-4 space-y-3">
            <p className="font-extrabold text-coffee-gold">دخول المسؤول</p>
            <input
              type="password"
              name="admin-password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة مرور المسؤول"
              className="w-full bg-coffee-card border border-coffee-line rounded-xl px-4 py-3
                         placeholder:text-coffee-muted/60 focus:outline-none focus:border-coffee-gold"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 bg-coffee-gold hover:bg-coffee-gold2 text-coffee-bg font-extrabold
                           rounded-xl py-3 active:scale-95 transition disabled:opacity-60"
              >
                {busy ? '...' : 'دخول'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAdmin(false); setPassword(''); setError(''); }}
                className="px-4 bg-coffee-card border border-coffee-line text-coffee-muted rounded-xl py-3"
              >
                رجوع
              </button>
            </div>
          </form>
        )}

        {error && (
          <p className="text-red-300 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-xl py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
