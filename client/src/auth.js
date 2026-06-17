// Tiny auth store backed by localStorage so the session survives refreshes.
// We keep two values: the JWT token (sent to the API) and the role (for UI gating).

const TOKEN_KEY = 'cafe_token';
const ROLE_KEY = 'cafe_role';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRole = () => localStorage.getItem(ROLE_KEY);
export const isAuthed = () => !!getToken();
export const isAdmin = () => getRole() === 'Admin';

export function setAuth(token, role) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}
