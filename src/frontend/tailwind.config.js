/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0E14",
        panelBg: "rgba(23, 29, 38, 0.6)",
        accentCyan: "#06B6D4",
        accentEmerald: "#10B981",
        accentRose: "#F43F5E",
      },
    },
  },
  plugins: [],
}
