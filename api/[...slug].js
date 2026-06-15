// Vercel catch-all serverless function.
// The filename "[...slug].js" makes Vercel route EVERY /api/* request to this one
// function (instead of expecting a separate file per endpoint). It receives the
// original URL (e.g. /api/menu), which lines up exactly with our Express routes.
module.exports = require('../server/app');
