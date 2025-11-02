/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
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
  			'verone-black': '#000000',
  			'verone-white': '#ffffff',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			}
  		},
  		fontFamily: {
  			logo: [
  				'Balgin Light SM Expanded',
  				'serif'
  			],
  			heading: [
  				'Monarch Regular',
  				'serif'
  			],
  			body: [
  				'Fieldwork 10 Geo Regular',
  				'sans-serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'monospace'
  			],
  			sans: [
  				'Fieldwork 10 Geo Regular',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif'
  			],
  			serif: [
  				'Monarch Regular',
  				'ui-serif',
  				'Georgia',
  				'serif'
  			]
  		},
  		fontSize: {
  			xs: [
  				'0.75rem',
  				{
  					lineHeight: '1rem'
  				}
  			],
  			sm: [
  				'0.875rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			base: [
  				'1rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			],
  			lg: [
  				'1.125rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			xl: [
  				'1.25rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			'2xl': [
  				'1.5rem',
  				{
  					lineHeight: '2rem'
  				}
  			],
  			'3xl': [
  				'1.875rem',
  				{
  					lineHeight: '2.25rem'
  				}
  			],
  			'6xl': [
  				'3.75rem',
  				{
  					lineHeight: '1',
  					letterSpacing: '0.15em'
  				}
  			],
  			'7xl': [
  				'4.5rem',
  				{
  					lineHeight: '1',
  					letterSpacing: '0.15em'
  				}
  			],
  			'8xl': [
  				'6rem',
  				{
  					lineHeight: '1',
  					letterSpacing: '0.15em'
  				}
  			]
  		},
  		letterSpacing: {
  			tightest: '-0.075em',
  			tighter: '-0.05em',
  			tight: '-0.025em',
  			normal: '0',
  			wide: '0.025em',
  			wider: '0.05em',
  			widest: '0.1em',
  			ultra: '0.25em',
  			luxury: '0.3em'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.7s ease-out forwards',
  			'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
  			'scale-in': 'scaleIn 0.5s ease-out forwards',
  			shimmer: 'shimmer 2s ease-in-out infinite',
  			'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		transitionDuration: {
  			fast: '150ms',
  			normal: '300ms',
  			slow: '500ms',
  			ultra: '700ms'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [],
}