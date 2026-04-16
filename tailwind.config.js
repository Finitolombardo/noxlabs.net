/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'nox-white': '#FFF1F4',
        'nox-white-soft': '#FFE6EC',
        'nox-white-muted': '#C8BEC2',
        'nox-yellow': '#F2C94C',
        'nox-yellow-hover': '#F5D76E',
        'nox-red': '#C93030',
        'nox-red-deep': '#A02020',
        'nox-red-glow': 'rgba(201, 48, 48, 0.25)',
      },
    },
  },
  plugins: [],
};
