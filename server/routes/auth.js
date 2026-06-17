const express = require('express');
const { signToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/admin-login  { password }
// Verifies against ADMIN_PASSWORD (env, configurable). On success returns an Admin JWT.
router.post('/admin-login', (req, res) => {
  const { password } = req.body;
  const expected = process.env.ADMIN_PASSWORD || 'admin123';
  if (!password || password !== expected) {
    return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });
  }
  const token = signToken({ role: 'Admin' });
  res.json({ token, role: 'Admin' });
});

// POST /api/auth/user-login  (no credentials)
// Anyone can become a "User": issues a restricted (read + add-order only) token.
router.post('/user-login', (req, res) => {
  const token = signToken({ role: 'User' });
  res.json({ token, role: 'User' });
});

module.exports = router;
