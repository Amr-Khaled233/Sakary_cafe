import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import CafeApp from './pages/CafeApp';
import { isAuthed } from './auth';

/**
 * Guard component: the auth check runs when THIS component renders (i.e. every
 * time the /app route is matched), so it reads the freshest token from
 * localStorage. (Doing the check inline in App's JSX would evaluate it only once
 * at first render — before login — and bounce every later visit back to "/".)
 */
function RequireAuth({ children }) {
  return isAuthed() ? children : <Navigate to="/" replace />;
}

/**
 * Routing:
 *   "/"     -> Landing (role selection / admin password)
 *   "/app"  -> the café app, only if a token exists; otherwise back to "/"
 *   "*"     -> redirect unknown paths to the landing page.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<RequireAuth><CafeApp /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
