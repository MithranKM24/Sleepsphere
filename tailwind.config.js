/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0a0a0a',
          secondary: '#1a1a1a',
          tertiary: '#2a2a2a',
          accent: '#1e3a8a',
          'accent-light': '#3b82f6',
          'accent-dark': '#1e40af',
          text: '#e5e7eb',
          'text-secondary': '#9ca3af',
          'text-muted': '#6b7280',
          border: '#374151',
          'border-light': '#4b5563',
        },
        blue: {
          'dark-primary': '#0f172a',
          'dark-secondary': '#1e293b',
          'dark-accent': '#3b82f6',
          'dark-light': '#60a5fa',
        }
      },
      backgroundImage: {
        'dark-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f172a 100%)',
        'blue-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
