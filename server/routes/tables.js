const express = require('express');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { buildActiveTablesTree } = require('../utils/build');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/tables  -> active tables, fully populated with customers + orders + totals.
// This single call drives the whole main screen.
router.get('/', async (req, res, next) => {
  try {
    const tree = await buildActiveTablesTree();
    res.json(tree);
  } catch (err) { next(err); }
});

// GET /api/tables/names  -> just [{ _id, tableName }] for active tables.
// Used by the User table-picker so Users don't download everyone's data.
// (Defined before any "/:id" route so "names" isn't treated as an id.)
router.get('/names', async (req, res, next) => {
  try {
    const tables = await Table.find({ isActive: true }).select('tableName').sort({ createdAt: 1 }).lean();
    res.json(tables);
  } catch (err) { next(err); }
});

// POST /api/tables  -> create a new table { tableName }  (Admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { tableName } = req.body;
    if (!tableName) return res.status(400).json({ message: 'tableName مطلوب' });
    const table = await Table.create({ tableName });
    res.status(201).json(table);
  } catch (err) { next(err); }
});

// PUT /api/tables/:id  -> rename a table { tableName }  (Admin only)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { tableName } = req.body;
    if (!tableName) return res.status(400).json({ message: 'tableName مطلوب' });
    const table = await Table.findByIdAndUpdate(req.params.id, { tableName }, { new: true });
    if (!table) return res.status(404).json({ message: 'الطاولة غير موجودة' });
    res.json(table);
  } catch (err) { next(err); }
});

// POST /api/tables/:id/reset  -> empty a table: delete all its customers + their
// orders, but KEEP the table itself (so it's ready for a fresh round).  (Admin only)
router.post('/:id/reset', requireAdmin, async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'الطاولة غير موجودة' });

    const customers = await Customer.find({ tableId: table._id }).select('_id');
    const customerIds = customers.map((c) => c._id);
    await Order.deleteMany({ customerId: { $in: customerIds } });
    await Customer.deleteMany({ tableId: table._id });

    res.json({ message: 'تم تصفير الطاولة', id: req.params.id });
  } catch (err) { next(err); }
});

// DELETE /api/tables/:id  -> delete a table + cascade its customers/orders.  (Admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'الطاولة غير موجودة' });

    // Find this table's customers, then wipe their orders, then the customers, then the table.
    const customers = await Customer.find({ tableId: table._id }).select('_id');
    const customerIds = customers.map((c) => c._id);

    await Order.deleteMany({ customerId: { $in: customerIds } });
    await Customer.deleteMany({ tableId: table._id });
    await Table.deleteOne({ _id: table._id });

    res.json({ message: 'تم حذف الطاولة وكل بياناتها', id: req.params.id });
  } catch (err) { next(err); }
});

module.exports = router;
