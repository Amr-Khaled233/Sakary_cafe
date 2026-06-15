import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development the React app runs on :5173 and the API on :5000.
// This proxy forwards any /api/* request to the Express server, so the
// frontend code can just call "/api/..." with no CORS/host juggling.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
