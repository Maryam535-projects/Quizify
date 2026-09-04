/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1535',        // near-black navy text
        brand: {
          50: '#F4F1FD',
          100: '#E9E3FB',
          200: '#D2C4F7',
          300: '#B69BF1',
          400: '#9A72E9',
          500: '#7C4FDE',
          600: '#6739C9',       // primary brand purple
          700: '#4F2DA8',
          800: '#382280',
          900: '#241752',       // deep indigo (logo dark end)
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,21,53,0.04), 0 4px 16px rgba(27,21,53,0.06)',
        cardHover: '0 4px 8px rgba(27,21,53,0.06), 0 12px 28px rgba(27,21,53,0.10)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
