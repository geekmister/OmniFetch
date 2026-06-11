/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d1117',
          elevated: '#161b22',
          hover: '#1c2128',
          border: '#30363d',
        },
        accent: {
          DEFAULT: '#58a6ff',
          hover: '#79c0ff',
          muted: '#1f6feb',
        },
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e',
          muted: '#6e7681',
        },
        success: '#3fb950',
        warning: '#d29922',
        danger: '#f85149',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
          'Helvetica Neue', 'Arial', 'sans-serif',
        ],
        mono: ['SF Mono', 'Fira Code', 'Fira Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}
