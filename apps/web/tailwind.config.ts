import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          primary: '#1a365d',
          secondary: '#2c5282',
          dark: '#0f172a',
        },
        gold: {
          DEFAULT: '#d4a853',
          hover: '#c9973f',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Source Sans 3', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
