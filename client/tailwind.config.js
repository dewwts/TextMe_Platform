/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['CHULALONGKORN', 'sans-serif'],
      },
      colors: {
        'pink-primary': '#e45b8f',
      },
    },
  },
  plugins: [],
}
