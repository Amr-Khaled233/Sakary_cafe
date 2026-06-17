require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { ensureDB } = require('./config/db');
const { requireAuth } = require('./middleware/auth');

// The configured Express app, with NO app.listen(). This lets us reuse it both
// for local dev (server.js) and as a Vercel serverless handler (../api/index.js).
const app = express();

/* ----------------------------- Middleware ----------------------------- */
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Ensure the DB is connected (cached) before any route handler runs. This is what
// makes the API work on serverless cold starts.
app.use(async (req, res, next) => {
  try { await ensureDB(); next(); }
  catch (err) { next(err); }
});

/* ------------------------------- Routes ------------------------------- */
// Public routes (no token needed): health check + login.
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));

// Everything below this line requires a valid token (Admin or User).
// Individual routes additionally enforce requireAdmin where needed.
app.use('/api', requireAuth);
app.use('/api/menu', require('./routes/menu'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

/* ------------------------- Central error handler ---------------------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'خطأ في الخادم' });
});

module.exports = app;
