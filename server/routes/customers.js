const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Table = require('../models/Table');
const { finalTotalOf } = require('../utils/build');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/customers  -> add a customer to a table { tableId, customerName }
// Find-or-create: if someone with the same name already exists on that table,
// return THEM (so a User re-entering the same name resumes their existing bill
// instead of creating a duplicate). Otherwise create a new customer.
// Allowed for any logged-in role.
router.post('/', async (req, res, next) => {
  try {
    const { tableId, customerName } = req.body;
    if (!tableId || !customerName) return res.status(400).json({ message: 'tableId و customerName مطلوبين' });
    const name = String(customerName).trim();

    // Case-insensitive exact match on the same table (collation strength 2).
    let customer = await Customer.findOne({ tableId, customerName: name })
      .collation({ locale: 'ar', strength: 2 });
    if (customer) return res.status(200).json(customer); // resume existing

    customer = await Customer.create({ tableId, customerName: name });
    res.status(201).json(customer);
  } catch (err) { next(err); }
});

// GET /api/customers/:id  -> ONE customer enriched with their orders + totals
// + their table name. Used by the User view so a User only ever fetches their
// own data (never the whole tree). Any logged-in role.
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return res.status(404).json({ message: 'الزبون غير موجود' });
    const orders = await Order.find({ customerId: customer._id }).lean();
    const { subtotal, finalTotal } = finalTotalOf(customer, orders);
    const table = await Table.findById(customer.tableId).lean();
    res.json({ ...customer, orders, subtotal, finalTotal, tableName: table ? table.tableName : '' });
  } catch (err) { next(err); }
});

// PUT /api/customers/:id  -> rename the customer and/or set/clear the manual
// final-price override. Send any of:
//   { customerName: "..." }            -> rename  (any logged-in role; a User edits their own)
//   { customOverridePrice: number }    -> override final price  (Admin only)
//   { customOverridePrice: null | "" } -> clear the override     (Admin only)
router.put('/:id', async (req, res, next) => {
  try {
    const update = {};
    if (req.body.customerName !== undefined) update.customerName = String(req.body.customerName).trim();
    if (req.body.customOverridePrice !== undefined) {
      if (req.user.role !== 'Admin') return res.status(403).json({ message: 'تعديل السعر للمسؤول فقط' });
      update.customOverridePrice = req.body.customOverridePrice === '' ? null : req.body.customOverridePrice;
    }
    const customer = await Customer.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!customer) return res.status(404).json({ message: 'الزبون غير موجود' });
    res.json(customer);
  } catch (err) { next(err); }
});

// PATCH /api/customers/:id/paid  -> mark as paid.  (Admin only)
router.patch('/:id/paid', requireAdmin, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'الزبون غير موجود' });
    customer.isPaid = req.body.isPaid !== undefined ? !!req.body.isPaid : !customer.isPaid;
    await customer.save();
    res.json(customer);
  } catch (err) { next(err); }
});

// DELETE /api/customers/:id  -> remove a customer + their orders.
// Any logged-in role: an Admin removes anyone; a User leaves a (wrong) table by
// removing their own record. The UI only ever exposes a User their own customer.
router.delete('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'الزبون غير موجود' });
    await Order.deleteMany({ customerId: customer._id });
    res.json({ message: 'تم حذف الزبون', id: req.params.id });
  } catch (err) { next(err); }
});

module.exports = router;
