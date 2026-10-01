/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#1D1B4C', soft: '#55527F' },   // deep indigo - text and primary actions
        paper: '#F6F4FF',                                // lilac-white page background
        mist: '#ECE9FF',                                 // subtle fills
        line: '#DAD6F2',                                 // borders
        sun: { DEFAULT: '#FFB627', deep: '#E89A00' },    // the draw: balls, prize pool, highlights
        heart: { DEFAULT: '#FF5D73', soft: '#FFE3E7' },  // charity
        sea: { DEFAULT: '#1F9D8C', soft: '#D9F3EE' },    // success / paid
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: { lift: '0 10px 30px -12px rgba(29, 27, 76, 0.25)' },
    },
  },
  plugins: [],
};
