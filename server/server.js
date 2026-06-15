// Local development entry point. Connects to MongoDB then starts the HTTP server.
// (In production on Vercel, ../api/index.js uses the same app as a serverless fn.)
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});
