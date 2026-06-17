const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/** Sign a JWT carrying the role (and any extra payload). Valid for 30 days. */
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

/**
 * requireAuth: rejects the request unless it carries a valid "Authorization: Bearer <token>".
 * On success it attaches the decoded payload (e.g. { role: 'Admin' }) to req.user.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'مطلوب تسجيل الدخول' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'الجلسة غير صالحة، سجّل الدخول من جديد' });
  }
}

/**
 * requireAdmin: must run after requireAuth (or on a globally-authed router).
 * Blocks anyone whose role isn't 'Admin'.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'هذه الصلاحية للمسؤول فقط' });
  }
  next();
}

module.exports = { signToken, requireAuth, requireAdmin };
