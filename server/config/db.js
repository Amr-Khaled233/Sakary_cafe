const mongoose = require('mongoose');
const dns = require('dns');

// MongoDB Atlas "mongodb+srv://" needs an SRV DNS lookup. Some networks/resolvers
// refuse SRV queries (ECONNREFUSED) even when normal browsing works. Pointing Node
// at a public resolver makes the lookup reliable everywhere. (Harmless on networks
// whose default resolver already supports SRV.)
dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);

// Cache the connection across invocations. On serverless (Vercel) each function
// instance reuses one connection pool instead of opening a new one per request.
// Stored on `global` so it survives module re-evaluation between invocations.
let cached = global._mongo;
if (!cached) cached = global._mongo = { conn: null, promise: null };

/**
 * Ensure a live MongoDB connection (creating it once, then reusing it).
 * Returns the mongoose instance.
 */
async function ensureDB() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set (check your .env / Vercel env vars)');
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

/** Local-dev helper: connect once at startup with friendly logging. */
async function connectDB() {
  try {
    await ensureDB();
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = { ensureDB, connectDB };
