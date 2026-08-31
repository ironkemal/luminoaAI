import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // Sage / Emerald
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // Warm Amber
          600: "#d97706",
          700: "#b45309",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03)",
        card: "0 4px 20px -2px rgba(16, 185, 129, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        glow: "0 0 25px -5px rgba(16, 185, 129, 0.3)",
      },
      keyframes: {
        "timer-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.03)", opacity: "0.9" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "timer-pulse": "timer-pulse 1.5s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
