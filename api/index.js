// Vercel serverless entry point.
// vercel.json rewrites every /api/* request (any depth) to this function, which
// hands it to our Express app. The original URL (e.g. /api/tables/:id) is preserved,
// so it lines up exactly with the Express routes.
module.exports = require('../server/app');
