/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B00',
        'primary-hover': '#E55F00',
        'primary-active': '#CC5400',
        'primary-subtle': '#FFF4EE',
        'primary-muted': '#FFE0C7',
        secondary: '#111827',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        'border-subtle': '#F3F4F6',
        success: '#16A34A',
        'success-light': '#DCFCE7',
        error: '#DC2626',
        'error-light': '#FEE2E2',
        warning: '#D97706',
        'warning-light': '#FEF3C7',
        info: '#2563EB',
        'info-light': '#DBEAFE',
      },
    },
  },
  plugins: [],
};