const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

/** A customer's subtotal = sum(price * quantity) of their orders. */
function subtotalOf(orders) {
  return orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
}

/**
 * Final total for a customer = manual override when set, otherwise the subtotal.
 * (override of 0 is valid — only null/undefined means "no override".)
 */
function finalTotalOf(customer, orders) {
  const sub = subtotalOf(orders);
  const hasOverride = customer.customOverridePrice !== null && customer.customOverridePrice !== undefined;
  return { subtotal: sub, finalTotal: hasOverride ? customer.customOverridePrice : sub };
}

/**
 * Build the full nested structure the frontend renders in one shot:
 *   [ { ...table, grandTotal, customers: [ { ...customer, subtotal, finalTotal, orders:[...] } ] } ]
 *
 * Done with 3 bulk queries (tables, customers, orders) + in-memory grouping —
 * avoids the N+1 query problem.
 */
async function buildActiveTablesTree() {
  const tables = await Table.find({ isActive: true }).sort({ createdAt: 1 }).lean();
  const tableIds = tables.map((t) => t._id);

  const customers = await Customer.find({ tableId: { $in: tableIds } }).lean();
  const customerIds = customers.map((c) => c._id);

  const orders = await Order.find({ customerId: { $in: customerIds } }).lean();

  // Group orders by customer.
  const ordersByCustomer = new Map();
  for (const o of orders) {
    const key = String(o.customerId);
    if (!ordersByCustomer.has(key)) ordersByCustomer.set(key, []);
    ordersByCustomer.get(key).push(o);
  }

  // Group customers by table, attaching their orders + computed totals.
  const customersByTable = new Map();
  for (const c of customers) {
    const custOrders = ordersByCustomer.get(String(c._id)) || [];
    const { subtotal, finalTotal } = finalTotalOf(c, custOrders);
    const enriched = { ...c, orders: custOrders, subtotal, finalTotal };
    const key = String(c.tableId);
    if (!customersByTable.has(key)) customersByTable.set(key, []);
    customersByTable.get(key).push(enriched);
  }

  // Assemble tables with their grand totals.
  return tables.map((t) => {
    const tableCustomers = customersByTable.get(String(t._id)) || [];
    const grandTotal = tableCustomers.reduce((sum, c) => sum + c.finalTotal, 0);
    return { ...t, customers: tableCustomers, grandTotal };
  });
}

module.exports = { subtotalOf, finalTotalOf, buildActiveTablesTree };
