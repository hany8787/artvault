/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f2b90d',
        'primary-hover': '#d4a00c',
        'bg-dark': '#221e10',
        'bg-darker': '#1a1709',
        'bg-light': '#f8f8f5',
        'surface-dark': '#2a2515',
      },
      fontFamily: {
        display: ['Newsreader', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}