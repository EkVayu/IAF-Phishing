/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3749A6",
        secondary: "#5267d1bb",
        foreground: "#BBEAF5",
        background: "#ffffff",
      },
    },
  },
  plugins: [],
};
