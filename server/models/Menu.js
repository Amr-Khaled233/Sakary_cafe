const mongoose = require('mongoose');

/**
 * Menu item.
 * isDefault = true  -> one of the fixed café drinks (seeded once).
 * isDefault = false -> a custom item the admin added later.
 */
const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Menu', menuSchema);
