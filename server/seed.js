require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const Menu = require('./models/Menu');

// The fixed café menu (prices in EGP).
const DEFAULT_MENU = [
  { name: 'شاي', price: 15 },
  { name: 'قهوة', price: 25 },
  { name: 'قهوة فرنساوي', price: 40 },
  { name: 'مياه', price: 10 },
  { name: 'كوفي ميكس', price: 25 },
  { name: 'بيبسي', price: 25 },
  { name: 'سفن', price: 25 },
  { name: 'في كولا', price: 30 },
  { name: 'ليمون نعناع', price: 30 },
];

/**
 * Seed the default menu items (idempotent): only inserts a default item if one
 * with the same name doesn't already exist. Safe to run multiple times.
 */
async function seed() {
  await connectDB();
  for (const item of DEFAULT_MENU) {
    await Menu.updateOne(
      { name: item.name, isDefault: true },
      { $setOnInsert: { ...item, isDefault: true } },
      { upsert: true }
    );
  }
  const count = await Menu.countDocuments({ isDefault: true });
  console.log(`✅ Seed complete. Default menu items: ${count}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
