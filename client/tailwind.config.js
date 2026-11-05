/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nexora: {
          darkest: '#090d16',
          dark: '#0e1526',
          card: '#141d33',
          border: '#1f2b48',
          accent: '#3b82f6',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          text: '#f1f5f9',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
