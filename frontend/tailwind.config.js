/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1412",
        moss: "#1f3b2e",
        sand: "#f7f1e8",
        coral: "#f26849",
        teal: "#7bd3c7",
        haze: "#dfe9e5",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        glow: "0 20px 60px rgba(123, 211, 199, 0.18)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(123, 211, 199, 0.2), transparent 30%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        "hero-grid": "auto, 48px 48px, 48px 48px",
      },
    },
  },
  plugins: [],
};
