/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold: "#f7d774",
        fire: "#ff4d2e",
        water: "#00d1ff",
        blackRich: "#07080d",
        panel: "rgba(255,255,255,0.06)",
        borderSoft: "rgba(255,255,255,0.10)",
      },
      boxShadow: {
        glow: "0 0 18px rgba(247, 215, 116, 0.18)",
        glow2: "0 0 28px rgba(255, 77, 46, 0.14)",
      },
    },
  },
  plugins: [],
};
