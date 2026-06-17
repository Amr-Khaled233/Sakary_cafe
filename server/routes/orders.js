const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

// POST /api/orders  -> add an item to a customer { customerId, itemName, price, quantity? }
// If the same item+price already exists for that customer, we bump its quantity instead
// of creating a duplicate line.
router.post('/', async (req, res, next) => {
  try {
    const { customerId, itemName, price, quantity = 1 } = req.body;
    if (!customerId || !itemName || price == null) {
      return res.status(400).json({ message: 'customerId و itemName و price مطلوبين' });
    }
    let order = await Order.findOne({ customerId, itemName, price });
    if (order) {
      order.quantity += quantity;
      await order.save();
    } else {
      order = await Order.create({ customerId, itemName, price, quantity });
    }
    res.status(201).json(order);
  } catch (err) { next(err); }
});

// PUT /api/orders/:id  -> change quantity.
// Accepts { delta: +1 | -1 } for the +/- buttons, or { quantity: N } to set absolutely.
// If the resulting quantity drops to 0 or below, the item is removed.
// Any logged-in role (a User adjusts their own items; the UI only shows them theirs).
router.put('/:id', async (req, res, next) => {
  try {
    const { delta, quantity } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'الصنف غير موجود' });

    if (delta !== undefined) order.quantity += delta;
    else if (quantity !== undefined) order.quantity = quantity;

    if (order.quantity <= 0) {
      await order.deleteOne();
      return res.json({ removed: true, id: req.params.id });
    }
    await order.save();
    res.json(order);
  } catch (err) { next(err); }
});

// DELETE /api/orders/:id  -> remove an item entirely. Any logged-in role.
router.delete('/:id', async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'الصنف غير موجود' });
    res.json({ message: 'تم الحذف', id: req.params.id });
  } catch (err) { next(err); }
});

module.exports = router;
