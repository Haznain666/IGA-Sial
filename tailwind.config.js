/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand — Emerald & Gold (derived from the IGA Sial Farm logo)
        brand: {
          50: '#E7F4EF',
          100: '#C6E6DA',
          200: '#9CD4C0',
          300: '#66BDA1',
          400: '#39A585',
          500: '#1E8A6E', // primary emerald
          600: '#177459',
          700: '#125C47',
          800: '#0F4A3C', // pine
          900: '#0A3329',
        },
        gold: {
          50: '#FEF6E0',
          100: '#FDE9B3',
          200: '#FCD880',
          300: '#FBC846',
          400: '#FBB315', // CTA gold
          500: '#EBA309',
          600: '#C98807',
          700: '#9E6B08',
          800: '#7A520B',
          900: '#5C3E0C',
        },
        moss: {
          DEFAULT: '#517336',
          light: '#6C904D',
          dark: '#3C5626',
        },
        pine: '#0F4A3C',
        ink: '#1C1B16',
        cream: '#F6F7F3',
        sand: '#EBEDE4',
        parchment: '#FBFBF8',
      },
      fontFamily: {
        heading: ['Lexend', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(16, 44, 34, 0.08), 0 8px 24px -8px rgba(16, 44, 34, 0.12)',
        lift: '0 8px 30px -6px rgba(16, 44, 34, 0.18)',
        gold: '0 8px 24px -8px rgba(251, 179, 21, 0.5)',
      },
      maxWidth: {
        content: '80rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.25s ease-out both',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [],
}
