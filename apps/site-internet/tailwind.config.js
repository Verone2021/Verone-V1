/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VÉRONE E-COMMERCE LUXURY - Noir/Blanc Pur
        verone: {
          // Base (Minimalisme extrême)
          black: '#000000',
          white: '#FFFFFF',

          // Gris sophistiqués (neutrals)
          gray: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#E5E5E5',
            300: '#D4D4D4',
            400: '#A3A3A3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
          },

          // Utilitaires (sobre)
          success: '#059669',
          error: '#DC2626',
          warning: '#D97706',
        },
      },

      fontFamily: {
        // Typographie Luxury
        playfair: ['Playfair Display', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },

      spacing: {
        // Custom spacing si besoin
        18: '4.5rem', // 72px
        88: '22rem', // 352px
      },

      boxShadow: {
        // Shadows luxury
        luxury: '0 20px 60px -10px rgba(0, 0, 0, 0.15)',
        'luxury-lg': '0 30px 80px -15px rgba(0, 0, 0, 0.25)',
        'luxury-xl': '0 40px 100px -20px rgba(0, 0, 0, 0.35)',
      },

      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
      },
    },
  },
  plugins: [],
};
