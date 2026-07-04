// Tiny fetch wrapper around the Express API. Every call goes to "/api/..." which
// Vite proxies to the backend in dev (see vite.config.js). Keeping all network
// code in one file means components never deal with fetch/JSON/error plumbing.

import { getToken, logout } from './auth';

const BASE = '/api';

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // A 401 on a normal call means the session expired/invalid -> back to landing.
  // (We skip this for /auth calls so a wrong password just shows an error.)
  if (res.status === 401 && !path.startsWith('/auth')) {
    logout();
    window.location.assign('/');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // Auth
  adminLogin: (password) => request('/auth/admin-login', { method: 'POST', body: { password } }),
  userLogin: () => request('/auth/user-login', { method: 'POST' }),

  // Menu
  getMenu: () => request('/menu'),
  addMenuItem: (data) => request('/menu', { method: 'POST', body: data }),
  updateMenuItem: (id, data) => request(`/menu/${id}`, { method: 'PUT', body: data }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: 'DELETE' }),
  adjustMenu: (delta) => request('/menu/adjust', { method: 'POST', body: { delta } }),

  // Tables (the GET returns the full nested tree with totals)
  getTables: () => request('/tables'),
  getTableNames: () => request('/tables/names'),
  addTable: (tableName) => request('/tables', { method: 'POST', body: { tableName } }),
  renameTable: (id, tableName) => request(`/tables/${id}`, { method: 'PUT', body: { tableName } }),
  resetTable: (id) => request(`/tables/${id}/reset`, { method: 'POST' }),
  deleteTable: (id) => request(`/tables/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomer: (id) => request(`/customers/${id}`),
  addCustomer: (tableId, customerName) =>
    request('/customers', { method: 'POST', body: { tableId, customerName } }),
  renameCustomer: (id, customerName) =>
    request(`/customers/${id}`, { method: 'PUT', body: { customerName } }),
  overridePrice: (id, customOverridePrice) =>
    request(`/customers/${id}`, { method: 'PUT', body: { customOverridePrice } }),
  setNote: (id, note) => request(`/customers/${id}`, { method: 'PUT', body: { note } }),
  togglePaid: (id, isPaid) =>
    request(`/customers/${id}/paid`, { method: 'PATCH', body: { isPaid } }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Orders
  addOrder: (data) => request('/orders', { method: 'POST', body: data }),
  changeQty: (id, delta) => request(`/orders/${id}`, { method: 'PUT', body: { delta } }),
  toggleOrderPaid: (id, isPaid) => request(`/orders/${id}/paid`, { method: 'PATCH', body: { isPaid } }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),

  // Admin
  getStats: () => request('/admin/stats'),
  resetShift: () => request('/admin/reset', { method: 'POST' }),
};

export const fmt = (n) => `${Math.round((n || 0) * 100) / 100} ج`;

// Sort a menu array by Arabic alphabetical name (a stable copy — doesn't mutate).
export const sortMenu = (arr) =>
  [...(arr || [])].sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar'));
