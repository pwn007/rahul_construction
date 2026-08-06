/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2.5rem', xl: '4rem' },
      screens: { '2xl': '1440px' },
    },
    extend: {
      colors: {
        /* ---- Brand (from portfolio PDF) ---- */
        navy: {
          50: '#EEF1F9',
          100: '#D6DEF0',
          200: '#AFBEE1',
          300: '#7F94CB',
          400: '#4F68B0',
          500: '#2B4491',
          600: '#1B3273',
          700: '#12265C',
          800: '#0A1B4D',
          900: '#071338',
          950: '#040B21',
        },
        cyan: {
          50: '#E6F7FE',
          100: '#C2ECFC',
          200: '#8CDCFA',
          300: '#4FC8F6',
          400: '#22B8F2',
          500: '#00AEEF',
          600: '#0089BF',
          700: '#026C97',
          800: '#075979',
          900: '#0B4A64',
          950: '#052F42',
        },
        /* ---- Material warmth ---- */
        sand: {
          50: '#FAF8F4',
          100: '#F7F3EC',
          200: '#EDE4D6',
          300: '#DFCFB6',
          400: '#CDB48E',
          500: '#B99465',
          600: '#A67B4E',
          700: '#8A6241',
          800: '#71503A',
          900: '#5D4332',
          950: '#32231A',
        },
        /* ---- Cinematic darks ---- */
        ink: {
          700: '#242B3D',
          800: '#1A2032',
          900: '#0F1420',
          950: '#05070D',
        },
        paper: '#F7F6F2',

        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
      },
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        deva: ['"Noto Sans Devanagari"', 'Outfit', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3.25rem, 9vw, 7.5rem)', { lineHeight: '0.92', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-lg': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '0.98', letterSpacing: '-0.032em', fontWeight: '600' }],
        'display-md': ['clamp(2rem, 4.2vw, 3.5rem)', { lineHeight: '1.04', letterSpacing: '-0.028em', fontWeight: '600' }],
        'display-sm': ['clamp(1.625rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.024em', fontWeight: '600' }],
        'heading-lg': ['clamp(1.375rem, 2vw, 1.75rem)', { lineHeight: '1.2', letterSpacing: '-0.018em', fontWeight: '600' }],
        'heading-md': ['clamp(1.125rem, 1.4vw, 1.375rem)', { lineHeight: '1.3', letterSpacing: '-0.012em', fontWeight: '600' }],
        'body-lg': ['clamp(1.0625rem, 1.1vw, 1.1875rem)', { lineHeight: '1.65' }],
        caption: ['0.8125rem', { lineHeight: '1.5' }],
        overline: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.18em', fontWeight: '600' }],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      boxShadow: {
        xs: '0 1px 2px rgb(10 27 77 / 0.06)',
        sm: '0 2px 8px rgb(10 27 77 / 0.06)',
        md: '0 12px 32px -8px rgb(10 27 77 / 0.12)',
        lg: '0 32px 64px -16px rgb(10 27 77 / 0.18)',
        xl: '0 48px 96px -24px rgb(10 27 77 / 0.24)',
        glow: '0 0 0 1px rgb(0 174 239 / 0.30), 0 8px 32px rgb(0 174 239 / 0.18)',
        inset: 'inset 0 1px 0 0 rgb(255 255 255 / 0.08)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
        'out-soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      maxWidth: {
        prose: '68ch',
        lead: '56ch',
      },
      backgroundImage: {
        'grid-blueprint':
          'linear-gradient(to right, rgb(255 255 255 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.06) 1px, transparent 1px)',
        'grid-light':
          'linear-gradient(to right, rgb(10 27 77 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(10 27 77 / 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '64px 64px',
        'grid-sm': '32px 32px',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translate3d(0,0,0)' },
          to: { transform: 'translate3d(-50%,0,0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.16,1,0.3,1) infinite',
      },
    },
  },
  plugins: [],
};
