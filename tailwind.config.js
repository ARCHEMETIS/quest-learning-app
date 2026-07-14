/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Mitr', 'sans-serif'],
        body: ['"Noto Sans Thai"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
