/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        mlb: {
          navy: '#132448',
          'navy-light': '#1e3a5f',
          'navy-dark': '#0a1a2e',
          red: '#c41e3a',
          'red-light': '#d63447',
          'red-dark': '#a01729',
        }
      }
    },
  },
  plugins: [],
};
