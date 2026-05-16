/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0d1117',
          secondary: '#161b22',
          tertiary: '#21262d',
          card: '#1c2128',
        },
        border: {
          default: '#30363d',
          muted: '#21262d',
          accent: '#388bfd',
        },
        text: {
          primary: '#e6edf3',
          secondary: '#7d8590',
          muted: '#484f58',
          link: '#58a6ff',
        },
        accent: {
          blue: '#388bfd',
          green: '#3fb950',
          red: '#f85149',
          yellow: '#d29922',
          purple: '#bc8cff',
          orange: '#f0883e',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
