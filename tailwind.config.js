/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'space': ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'slideInRight': 'slideInRight 0.6s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
