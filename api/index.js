// Vercel serverless entry point.
// Vercel routes every /api/* request (see vercel.json) to this file, which simply
// hands the request to our Express app. The app's routes are already prefixed with
// /api, so paths line up exactly.
module.exports = require('../server/app');
