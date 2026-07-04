const mongoose = require('mongoose');

/**
 * A customer sitting at a table.
 * customOverridePrice: when set (not null), it REPLACES the computed subtotal
 *                      as this customer's final price (manual override).
 * isPaid: marks the customer as settled — used by the shift revenue stats.
 */
const customerSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
  customerName: { type: String, required: true, trim: true },
  customOverridePrice: { type: Number, default: null },
  isPaid: { type: Boolean, default: false },
  note: { type: String, default: '' }, // free-text admin note (e.g. "ليه باقي 50")
});

module.exports = mongoose.model('Customer', customerSchema);
