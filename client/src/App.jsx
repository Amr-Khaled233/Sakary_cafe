import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import CafeApp from './pages/CafeApp';
import { isAuthed } from './auth';

/**
 * Routing + protected-route logic:
 *   "/"     -> Landing (role selection / admin password)
 *   "/app"  -> the café app, but only if a token exists; otherwise back to "/"
 * Any unknown path redirects to the landing page.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={isAuthed() ? <CafeApp /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
