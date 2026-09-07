/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        },
        civic: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#486581',
          600: '#203a43',
          700: '#0f2027',
          800: '#0c1b24',
          900: '#08131a'
        },
        slate: {
          850: '#151f32',
          900: '#0f172a',
          950: '#080d1a'
        },
        accent: {
          emerald: '#059669',
          teal: '#0d9488',
          amber: '#f59e0b',
          orange: '#ea580c',
          violet: '#7c3aed',
          indigo: '#4f46e5',
          rose: '#e11d48',
          cyan: '#0891b2'
        },
        success: { 50: '#f0fdf4', 500: '#10b981', 600: '#059669', 700: '#047857' },
        warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706' },
        danger: { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glow-violet': '0 0 25px -5px rgba(124, 58, 237, 0.3)',
        'card-elevated': '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)'
      }
    }
  },
  plugins: []
};
