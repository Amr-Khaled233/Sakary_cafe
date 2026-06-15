/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { cairo: ['Cairo', 'sans-serif'] },
      // Warm dark "café" palette reused across the whole UI.
      colors: {
        coffee: {
          bg: '#1c1410',
          card: '#2a201a',
          card2: '#33271f',
          line: '#43342a',
          cream: '#f4e6d4',
          muted: '#b89c84',
          gold: '#d9a566',
          gold2: '#c08a4a',
        },
      },
    },
  },
  plugins: [],
};
