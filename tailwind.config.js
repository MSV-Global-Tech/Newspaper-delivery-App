/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#F97316",
        success: "#16A34A",
        background: "#F8FAFC",
        accent: "#EEF2FF",
        muted: "#6B7280",
      },
    },
  },
  plugins: [],
}
