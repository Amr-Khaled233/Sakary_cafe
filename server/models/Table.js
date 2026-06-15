const mongoose = require('mongoose');

/**
 * A café table. While a shift is running it stays isActive = true.
 * "Reset shift" (admin) deactivates/clears tables for the next day.
 */
const tableSchema = new mongoose.Schema({
  tableName: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Table', tableSchema);
