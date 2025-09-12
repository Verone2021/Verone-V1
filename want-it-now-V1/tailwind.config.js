/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Want It Now Brand Colors
        'brand-copper': '#D4841A',
        'brand-green': '#2D5A27',
        'secondary-copper': '#E09834',
        'secondary-green': '#3A6B33',
        'light-copper': '#F5E6D3',
        'light-green': '#E8F0E7',
        'dark-copper': '#B8701C',
        'dark-green': '#1F3D1B',
      },
      boxShadow: {
        'modern': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)',
        'modern-lg': '0 8px 25px rgba(0, 0, 0, 0.08), 0 3px 10px rgba(0, 0, 0, 0.12)',
        'card-hover': '0 12px 30px rgba(0, 0, 0, 0.12), 0 4px 15px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'modern': '12px',
        'large': '16px',
      },
      fontFamily: {
        'circular': ['Circular', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      transitionTimingFunction: {
        'modern': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'card-hover': 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'button-hover': 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
  },
  plugins: [
    // Plugin pour les classes utilitaires personnalisées
    function({ addUtilities }) {
      const newUtilities = {
        '.gradient-copper': {
          background: 'linear-gradient(135deg, #D4841A 0%, #E09834 100%)',
        },
        '.gradient-green': {
          background: 'linear-gradient(135deg, #2D5A27 0%, #3A6B33 100%)',
        },
        '.modern-shadow': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)',
        },
        '.modern-shadow-lg': {
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08), 0 3px 10px rgba(0, 0, 0, 0.12)',
        },
        '.card-hover': {
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12), 0 4px 15px rgba(0, 0, 0, 0.15)',
          }
        },
        '.btn-modern': {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: '500',
          '&:hover': {
            transform: 'translateY(-1px)',
          }
        },
        '.text-spacing': {
          letterSpacing: '-0.015em',
        },
        '.rounded-modern': {
          borderRadius: '12px',
        },
        '.rounded-large': {
          borderRadius: '16px',
        },
        '.input-bg-alt': {
          backgroundColor: '#F5E6D3',
        },
        '.focus-copper': {
          '&:focus': {
            borderColor: '#D4841A !important',
            boxShadow: '0 0 0 3px rgba(212, 132, 26, 0.12) !important',
            outline: 'none !important',
          }
        },
        '.focus-green': {
          '&:focus': {
            borderColor: '#2D5A27 !important',
            boxShadow: '0 0 0 3px rgba(45, 90, 39, 0.12) !important',
            outline: 'none !important',
          }
        },
      }
      addUtilities(newUtilities)
    }
  ],
}