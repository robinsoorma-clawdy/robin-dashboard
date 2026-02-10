/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0d1117',
        'bg-secondary': '#161b22',
        'bg-tertiary': '#21262d',
        'text-primary': '#c9d1d9',
        'text-secondary': '#8b949e',
        'accent': '#58a6ff',
        'accent-hover': '#79c0ff',
        'success': '#238636',
        'warning': '#d29922',
        'danger': '#da3633',
      },
    },
  },
  plugins: [],
}
