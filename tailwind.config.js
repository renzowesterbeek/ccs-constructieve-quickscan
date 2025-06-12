/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#e0f6e2',
          200: '#a5e7c0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#1c442f',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        brand: {
          'dark-green': '#1c442f',
          'light-green': '#e0f6e2', 
          'medium-green': '#a5e7c0',
          'white': '#ffffff',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 