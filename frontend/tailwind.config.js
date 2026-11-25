/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        violet: {
          50: '#F8F3F9',
          100: '#F3EAF6',
          200: '#E6D4ED',
          300: '#D4B6DE',
          400: '#B888C6',
          500: '#925DA8',
          600: '#784C8A',
          700: '#633E72',
          800: '#4E315B',
          900: '#3C2547',
          950: '#2A1833',
        },
        purple: {
          glass: 'rgba(146, 93, 168, 0.12)',
          tint: 'rgba(184, 136, 198, 0.25)',
          border: 'rgba(146, 93, 168, 0.35)',
          accent: '#925DA8',
          dark: '#784C8A',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'ios': '1rem',
        'ios-lg': '1.25rem',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(146, 93, 168, 0.08)',
        'glass-hover': '0 12px 40px rgba(146, 93, 168, 0.12)',
      },
    },
  },
  plugins: [],
}
