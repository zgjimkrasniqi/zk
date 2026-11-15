/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: { 50: '#FFF8F1', 100: '#FEECDC', 200: '#F4E2D1', 300: '#E6D2BE' },
        bronze: { 300: '#D7C5B7', 400: '#BCA38B', 500: '#A08468', 600: '#8A6F57', 700: '#6B5442' },
        ink: { 500: '#4A4846', 600: '#3A3836', 700: '#2E2D2C', 800: '#232222', 900: '#1A1919' },
        status: { available: '#7A9E7E', reserved: '#D09A4E', sold: '#A8564C' },
      },
      fontFamily: {
        sans: ['Jost', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { wider2: '0.18em' },
      boxShadow: { panel: '0 20px 60px -20px rgba(35,34,34,0.35)' },
    },
  },
  plugins: [],
}
