module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-bigger': 'pulseBigger 1.5s infinite',  // Custom bigger pulse animation
      },
      keyframes: {
        pulseBigger: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },  // Increased scale
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
