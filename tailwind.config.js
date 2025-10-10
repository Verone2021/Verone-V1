/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Tremor React content paths
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design System Vérone - Noir et Blanc Minimaliste
        'verone-black': '#000000',
        'verone-white': '#ffffff',

        // shadcn/ui colors adapted for Vérone
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        // Typographies officielles Vérone selon design-tokens
        'logo': ['Balgin Light SM Expanded', 'serif'],      // UNIQUEMENT pour logo
        'heading': ['Monarch Regular', 'serif'],             // Sous-titres, navigation
        'body': ['Fieldwork 10 Geo Regular', 'sans-serif'], // Interface, corps
        'mono': ['JetBrains Mono', 'monospace'],            // Code, références

        // Fallbacks system pour compatibilité
        'sans': ['Fieldwork 10 Geo Regular', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'serif': ['Monarch Regular', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        // Scale harmonieuse Vérone selon design-tokens
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px - Labels, métadonnées
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px - Descriptions, sous-textes
        'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px - Corps principal
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px - Sous-titres
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px - Titres de sections
        '2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px - Titres principaux
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px - Headers display

        // Tailles spéciales pour logo
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '0.15em' }],  // 60px
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '0.15em' }],   // 72px
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '0.15em' }],     // 96px
      },
      letterSpacing: {
        // Espacement typographique Vérone
        'tightest': '-0.075em',
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
        'ultra': '0.25em',    // Pour effet hover logo
        'luxury': '0.3em',    // Pour effet premium
      },
      animation: {
        // Animations personnalisées Vérone
        'fade-in': 'fadeIn 0.7s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        // Animations sidebar collapsible
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up': 'accordion-up 200ms ease-out',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      transitionDuration: {
        // Durées standards selon design-tokens
        'fast': '150ms',      // Hovers, micro-interactions
        'normal': '300ms',    // Modals, navigation
        'slow': '500ms',      // Transitions de page
        'ultra': '700ms',     // Animations premium
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}