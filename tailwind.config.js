/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			montessori: {
  				// Per-school themeable colors — driven by CSS variables (RGB channel
  				// triplets) set by SchoolThemeProvider. The `<alpha-value>` pattern
  				// keeps Tailwind opacity modifiers (e.g. bg-montessori-primary/8) working.
  				primary: 'rgb(var(--montessori-primary) / <alpha-value>)',
  				secondary: 'rgb(var(--montessori-secondary) / <alpha-value>)',
  				accent: 'rgb(var(--montessori-accent) / <alpha-value>)',
  				earth: 'rgb(var(--montessori-earth) / <alpha-value>)',
  				sky: 'rgb(var(--montessori-sky) / <alpha-value>)',
  				bg: 'rgb(var(--montessori-bg) / <alpha-value>)',
  				card: 'rgb(var(--montessori-card) / <alpha-value>)'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-inter)'
  			],
  			serif: [
  				'var(--font-playfair)'
  			],
  			tight: [
  				'var(--font-inter-tight)'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
