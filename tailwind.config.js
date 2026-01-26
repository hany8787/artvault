/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#f2b90d',
        'primary-hover': '#d4a00c',
        'primary-light': '#f5c93d',
        // Dark mode colors
        'bg-dark': '#221e10',
        'bg-darker': '#1a1709',
        'surface-dark': '#2a2515',
        'text-dark': '#f4f4f0',
        // Light mode colors
        'bg-light': '#f9f9f7',
        'bg-lighter': '#ffffff',
        'surface-light': '#ffffff',
        'text-light': '#181611',
        // Neutral
        'gold': '#f2b90d',
        'gold-muted': 'rgba(242, 185, 13, 0.3)',
      },
      fontFamily: {
        display: ['Newsreader', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        body: ['Newsreader', 'serif'],
      },
      fontSize: {
        '7xl': '5rem',
        '8xl': '6rem',
        '9xl': '8rem',
      },
      letterSpacing: {
        'super-wide': '0.2em',
      },
      animation: {
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        scanLine: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(242, 185, 13, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(242, 185, 13, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
