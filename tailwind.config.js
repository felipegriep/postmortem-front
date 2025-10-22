/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,scss}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#673ab7', // Exemplo da cor primária
        // ... outras cores do seu tema Material
      }
    },
  },
  plugins: [],
};
