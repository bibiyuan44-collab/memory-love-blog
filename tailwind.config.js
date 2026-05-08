/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        win: {
          blue: '#2a3f6e',
          gray: '#c4d0e4',
          darkGray: '#8899ae',
          darkerGray: '#4a5568',
          light: '#f6f8fc',
          green: '#00ff41',
          teal: '#6f9fd8'
        }
      },
      fontFamily: {
        'vt323': ['VT323', 'monospace'],
        'comic': ['"Comic Sans MS"', 'cursive'],
        'courier': ['"Courier New"', 'monospace'],
        'yuyuan': ['"YouYuan"', '"Round"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}