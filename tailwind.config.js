module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    fontFamily: {
      'sans': ['"felt-tip-woman"', 'sans-serif']
    },
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
