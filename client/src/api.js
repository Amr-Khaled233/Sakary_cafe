// Tiny fetch wrapper around the Express API. Every call goes to "/api/..." which
// Vite proxies to the backend in dev (see vite.config.js). Keeping all network
// code in one file means components never deal with fetch/JSON/error plumbing.

const BASE = '/api';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // Menu
  getMenu: () => request('/menu'),
  addMenuItem: (data) => request('/menu', { method: 'POST', body: data }),
  updateMenuItem: (id, data) => request(`/menu/${id}`, { method: 'PUT', body: data }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: 'DELETE' }),

  // Tables (the GET returns the full nested tree with totals)
  getTables: () => request('/tables'),
  addTable: (tableName) => request('/tables', { method: 'POST', body: { tableName } }),
  renameTable: (id, tableName) => request(`/tables/${id}`, { method: 'PUT', body: { tableName } }),
  deleteTable: (id) => request(`/tables/${id}`, { method: 'DELETE' }),

  // Customers
  addCustomer: (tableId, customerName) =>
    request('/customers', { method: 'POST', body: { tableId, customerName } }),
  renameCustomer: (id, customerName) =>
    request(`/customers/${id}`, { method: 'PUT', body: { customerName } }),
  overridePrice: (id, customOverridePrice) =>
    request(`/customers/${id}`, { method: 'PUT', body: { customOverridePrice } }),
  togglePaid: (id, isPaid) =>
    request(`/customers/${id}/paid`, { method: 'PATCH', body: { isPaid } }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Orders
  addOrder: (data) => request('/orders', { method: 'POST', body: data }),
  changeQty: (id, delta) => request(`/orders/${id}`, { method: 'PUT', body: { delta } }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),

  // Admin
  getStats: () => request('/admin/stats'),
  resetShift: () => request('/admin/reset', { method: 'POST' }),
};

export const fmt = (n) => `${Math.round((n || 0) * 100) / 100} ج`;
