import type { Config } from "tailwindcss";

// Q64 visual language: deep midnight navy base, electric/neon blue accents,
// subtle cyan and blue-violet, cool-white type, luminous blue borders.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          900: "#05070f", // deepest background
          800: "#080b18",
          700: "#0b1024", // panel base
          600: "#101736", // card
          500: "#16204a", // raised control
        },
        electric: {
          400: "#4d8dff",
          500: "#2e7df6", // primary electric blue
          600: "#1e63d8",
        },
        cyan: {
          q: "#34d8f1",
        },
        violet: {
          q: "#8b5cf6",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(46,125,246,0.35)",
        "glow-soft": "0 0 40px rgba(46,125,246,0.18)",
        panel: "0 8px 40px rgba(0,0,0,0.45)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "logo-reveal": {
          "0%": { opacity: "0", transform: "scale(0.92)", filter: "blur(8px)" },
          "60%": { opacity: "1", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        "beam": {
          "0%, 100%": { opacity: "0.4", transform: "scaleY(0.9)" },
          "50%": { opacity: "1", transform: "scaleY(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slow-drift": {
          "0%": { transform: "scale(1.05) translate(0,0)" },
          "50%": { transform: "scale(1.08) translate(-1.5%, -1%)" },
          "100%": { transform: "scale(1.05) translate(0,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease forwards",
        "fade-up": "fade-up 0.6s ease forwards",
        "logo-reveal": "logo-reveal 1.1s cubic-bezier(0.2,0.8,0.2,1) forwards",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        beam: "beam 3s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        "slow-drift": "slow-drift 24s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
