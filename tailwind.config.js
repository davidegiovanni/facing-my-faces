module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    fontFamily: {
      'sans': ['Karla', 'sans-serif']
    },
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
