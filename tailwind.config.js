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
        // Light mode
        'bg-light': '#FFFFFF',
        'bg-light-secondary': '#F7F7F5',
        'text-light': '#1A1A1A',
        'text-light-secondary': '#6B6B6B',
        'border-light': '#E5E5E5',
        // Dark mode
        'bg-dark': '#0D0D0D',
        'bg-dark-secondary': '#1A1A1A',
        'text-dark': '#FFFFFF',
        'text-dark-secondary': '#A0A0A0',
        'border-dark': '#2A2A2A',
        // Accent
        'accent': '#C9A227',
        'accent-dark': '#D4AF37',
        'accent-hover': '#B8931F',
        // Semantic
        'danger': '#DC2626',
        'success': '#16A34A',
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
        'serif': ['"Cormorant Garamond"', 'serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      letterSpacing: {
        'widest': '0.15em',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scanLine: {
          '0%, 100%': { top: '0%' },
          '50%': { top: '100%' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionDuration: {
        '300': '300ms',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
