/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sakura: {
          50: '#fff5f7',
          100: '#ffe3e9',
          200: '#ffccd8',
          300: '#fca5ba',
          400: '#f87295',
          500: '#ee4370',
          600: '#db2454',
          700: '#b8173f',
        },
        tea: {
          50: '#f4f8f0',
          100: '#e5f1dc',
          200: '#cce3bc',
          600: '#698f50',
          700: '#4e6d3a',
          800: '#385029',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        japanese: ['"Yu Mincho"', '"Hiragino Mincho ProN"', '"MS PMincho"', 'serif'],
        handwritten: ['"Great Vibes"', 'cursive'],
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        swayIntense: {
          '0%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-11deg)' },
          '60%': { transform: 'rotate(7deg)' },
          '80%': { transform: 'rotate(-3deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        sway: 'sway 4s ease-in-out infinite',
        swayIntense: 'swayIntense 2.4s ease-in-out',
        float: 'float 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
