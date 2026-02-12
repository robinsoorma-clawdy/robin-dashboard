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
        'bg-primary': '#06080d',
        'bg-secondary': '#0d1117',
        'bg-tertiary': '#161b22',
        'bg-elevated': '#1c2128',
        'text-primary': '#e6edf3',
        'text-secondary': '#8b949e',
        'text-muted': '#484f58',
        'accent': '#388bfd',
        'accent-hover': '#58a6ff',
        'success': '#3fb950',
        'warning': '#d29922',
        'danger': '#f85149',
      },
    },
  },
  plugins: [],
}
