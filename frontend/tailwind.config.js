/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          glass: 'rgba(139, 92, 246, 0.12)',
          tint: 'rgba(167, 139, 250, 0.25)',
          border: 'rgba(139, 92, 246, 0.35)',
          accent: '#8b5cf6',
          dark: '#6d28d9',
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
        'glass': '0 8px 32px rgba(139, 92, 246, 0.08)',
        'glass-hover': '0 12px 40px rgba(139, 92, 246, 0.12)',
      },
    },
  },
  plugins: [],
}
