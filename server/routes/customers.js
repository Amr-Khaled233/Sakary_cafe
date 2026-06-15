const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

const router = express.Router();

// POST /api/customers  -> add a customer to a table { tableId, customerName }
router.post('/', async (req, res, next) => {
  try {
    const { tableId, customerName } = req.body;
    if (!tableId || !customerName) return res.status(400).json({ message: 'tableId و customerName مطلوبين' });
    const customer = await Customer.create({ tableId, customerName });
    res.status(201).json(customer);
  } catch (err) { next(err); }
});

// PUT /api/customers/:id  -> rename the customer and/or set/clear the manual
// final-price override. Send any of:
//   { customerName: "..." }            -> rename
//   { customOverridePrice: number }    -> override final price
//   { customOverridePrice: null | "" } -> clear the override
router.put('/:id', async (req, res, next) => {
  try {
    const update = {};
    if (req.body.customerName !== undefined) update.customerName = req.body.customerName;
    if (req.body.customOverridePrice !== undefined) {
      update.customOverridePrice = req.body.customOverridePrice === '' ? null : req.body.customOverridePrice;
    }
    const customer = await Customer.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!customer) return res.status(404).json({ message: 'الزبون غير موجود' });
    res.json(customer);
  } catch (err) { next(err); }
});

// PATCH /api/customers/:id/paid  -> mark as paid. Body { isPaid } optional; toggles if omitted.
router.patch('/:id/paid', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'الزبون غير موجود' });
    customer.isPaid = req.body.isPaid !== undefined ? !!req.body.isPaid : !customer.isPaid;
    await customer.save();
    res.json(customer);
  } catch (err) { next(err); }
});

// DELETE /api/customers/:id  -> remove a customer and cascade delete their orders.
router.delete('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'الزبون غير موجود' });
    await Order.deleteMany({ customerId: customer._id });
    res.json({ message: 'تم حذف الزبون', id: req.params.id });
  } catch (err) { next(err); }
});

module.exports = router;
