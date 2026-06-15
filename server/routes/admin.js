const express = require('express');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { finalTotalOf } = require('../utils/build');

const router = express.Router();

// GET /api/admin/stats  -> daily/shift summary:
//   - totalRevenue: sum of final totals of all PAID customers
//   - pendingRevenue: sum of final totals of UNPAID customers (still on tables)
//   - activeTables, totalCustomers, paidCustomers counts
router.get('/stats', async (req, res, next) => {
  try {
    const activeTables = await Table.countDocuments({ isActive: true });
    const customers = await Customer.find().lean();
    const customerIds = customers.map((c) => c._id);
    const orders = await Order.find({ customerId: { $in: customerIds } }).lean();

    // Group orders by customer for total computation.
    const byCustomer = new Map();
    for (const o of orders) {
      const k = String(o.customerId);
      if (!byCustomer.has(k)) byCustomer.set(k, []);
      byCustomer.get(k).push(o);
    }

    let totalRevenue = 0;
    let pendingRevenue = 0;
    let paidCustomers = 0;
    for (const c of customers) {
      const { finalTotal } = finalTotalOf(c, byCustomer.get(String(c._id)) || []);
      if (c.isPaid) { totalRevenue += finalTotal; paidCustomers += 1; }
      else { pendingRevenue += finalTotal; }
    }

    res.json({
      totalRevenue,
      pendingRevenue,
      activeTables,
      totalCustomers: customers.length,
      paidCustomers,
    });
  } catch (err) { next(err); }
});

// POST /api/admin/reset  -> wipe all tables, customers and orders for a fresh shift.
// The menu is intentionally preserved.
router.post('/reset', async (req, res, next) => {
  try {
    await Order.deleteMany({});
    await Customer.deleteMany({});
    await Table.deleteMany({});
    res.json({ message: 'تمت تصفية الوردية. كل الطاولات والطلبات اتمسحت.' });
  } catch (err) { next(err); }
});

module.exports = router;
