import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          50: "#eafff6",
          100: "#c8ffe9",
          200: "#90ffd5",
          300: "#57ffc1",
          400: "#1effad",
          500: "#00e694",
          600: "#00b373",
          700: "#008052",
          800: "#004d32",
          900: "#001a11",
        },
        glass: "rgba(15, 23, 42, 0.7)",
      },
      boxShadow: {
        glow: "0 0 25px rgba(0, 230, 148, 0.35)",
      },
      animation: {
        pulseSlow: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 3s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0, 230, 148, 0.4)" },
          "50%": { boxShadow: "0 0 18px rgba(0, 230, 148, 0.8)" },
        },
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
