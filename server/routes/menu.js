const express = require('express');
const Menu = require('../models/Menu');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/menu  -> all menu items (default first, then custom). Any logged-in role.
router.get('/', async (req, res, next) => {
  try {
    const items = await Menu.find().sort({ isDefault: -1, createdAt: 1 });
    res.json(items);
  } catch (err) { next(err); }
});

// POST /api/menu  -> add a custom menu item { name, price }  (Admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, price } = req.body;
    if (!name || price == null) return res.status(400).json({ message: 'name و price مطلوبين' });
    const item = await Menu.create({ name, price, isDefault: false });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

// PUT /api/menu/:id  -> edit a menu item's name/price  (Admin only)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, price } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (price !== undefined) update.price = price;
    const item = await Menu.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ message: 'الصنف غير موجود' });
    res.json(item);
  } catch (err) { next(err); }
});

// DELETE /api/menu/:id  -> remove a menu item  (Admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const item = await Menu.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'الصنف غير موجود' });
    res.json({ message: 'تم الحذف', id: req.params.id });
  } catch (err) { next(err); }
});

module.exports = router;
