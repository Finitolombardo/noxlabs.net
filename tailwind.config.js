/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'nox-white': '#FFF1F4',
        'nox-white-soft': '#FFE6EC',
        'nox-white-muted': '#E8DDE1',
        'nox-yellow': '#F2C94C',
        'nox-yellow-hover': '#F5D76E',
      },
    },
  },
  plugins: [],
};
