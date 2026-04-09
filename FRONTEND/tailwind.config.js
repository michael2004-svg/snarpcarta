/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'snap-bg': '#0f0f0f',
        'snap-card': '#1a1a1a',
        'snap-surface': '#252525',
        'snap-border': '#333333',
        'snap-text': '#f5f5f5',
        'snap-muted': '#888888',
        'snap-accent': '#00d4ff',
        'snap-accent-hover': '#00b8e0',
      },
      fontFamily: {
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
