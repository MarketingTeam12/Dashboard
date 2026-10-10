/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#001B3D', 700: '#002452', 600: '#0A2E5C' },
        primary: { DEFAULT: '#1262E0', 600: '#0F55C4', 50: '#EAF2FF', 100: '#D6E6FF' },
        page: '#F3F6FB',
        ink: { DEFAULT: '#071344', 600: '#2A3560', 500: '#4B5578', 400: '#7A839F' },
        line: { DEFAULT: '#DFE8F5', soft: '#EDF2F9' },
        success: { DEFAULT: '#00B978', 50: '#E3F8EF', 700: '#058A5C' },
        warning: { DEFAULT: '#FFB020', 50: '#FFF5DF', 700: '#B87500' },
        danger: { DEFAULT: '#FF3344', 50: '#FFE8EA', 700: '#D61F30' },
        violet: { DEFAULT: '#8B3DF0', 50: '#F2EAFE' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(7,19,68,0.04), 0 1px 6px rgba(7,19,68,0.04)', pop: '0 10px 30px rgba(7,19,68,0.14)' },
      fontSize: { '2xs': ['11px', '14px'], xs13: ['13px', '18px'] },
    },
  },
  plugins: [],
};
