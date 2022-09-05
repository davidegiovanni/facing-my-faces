module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    fontFamily: {
      'sans': ['"carlmarx-handwriting-regular"', 'sans-serif']
    },
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
