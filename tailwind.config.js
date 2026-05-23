/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Light mode tokens
        cream: '#F2EDE4',
        'gold-primary': '#B8870B',
        'gold-light': '#D4A320',
        'gold-dark': '#8B6508',
        'emerald-deep': '#1C5631',
        'emerald-mid': '#2D7A46',
        // Dark mode tokens
        'dark-bg': '#0D1F14',
        'dark-surface': '#162A1C',
        'dark-raised': '#1E3826',
        'dark-gold': '#D4A320',
        'dark-gold-light': '#E8B830',
        'dark-text': '#F0E8D0',
        'dark-subtext': '#9AAB9D',
        // Tag colors
        'tag-tech': '#3B82F6',
        'tag-cultural': '#A855F7',
        'tag-sports': '#22C55E',
        'tag-academic': '#F97316',
        'tag-workshop': '#EAB308',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9950F, #8B6508)',
        'gold-gradient-dark': 'linear-gradient(135deg, #D4A320, #9A7010)',
        'emerald-gradient': 'linear-gradient(135deg, #1C5631, #0D3320)',
      },
      boxShadow: {
        'gold': '0 4px 20px rgba(184, 135, 11, 0.25)',
        'gold-dark': '0 4px 20px rgba(212, 163, 32, 0.2)',
        'card': '0 2px 12px rgba(0,0,0,0.08)',
        'card-dark': '0 2px 12px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
