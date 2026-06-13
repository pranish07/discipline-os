/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          red: '#e53e3e',
          green: '#38a169',
          muted: '#a0aec0',
          card: '#1a1a1a',
          border: '#2d2d2d',
        },
      },
    },
  },
  plugins: [],
};
