/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8edf4',
          100: '#c5d0e3',
          200: '#9fb2d0',
          300: '#7994bd',
          400: '#5c7daf',
          500: '#3f66a1',
          600: '#365893',
          700: '#2b4a7f',
          800: '#1e3a5f',
          900: '#152a45',
        },
      },
    },
  },
  plugins: [],
};
