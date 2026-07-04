const mongoose = require('mongoose');

/**
 * A single line item ordered by a customer.
 * We snapshot itemName + price at the moment of ordering, so later edits to the
 * global menu price do NOT retroactively change open bills.
 */
const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    isPaid: { type: Boolean, default: false }, // this individual item settled?
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
