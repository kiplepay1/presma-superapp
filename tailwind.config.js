/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          soft: "rgb(var(--c-ink-soft) / <alpha-value>)",
          faint: "rgb(var(--c-ink-faint) / <alpha-value>)",
        },
        paper: "rgb(var(--c-paper) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        border: {
          DEFAULT: "rgb(var(--c-border) / <alpha-value>)",
          strong: "rgb(var(--c-border-strong) / <alpha-value>)",
        },
        brand: {
          50: "rgb(var(--c-brand-50) / <alpha-value>)",
          100: "rgb(var(--c-brand-100) / <alpha-value>)",
          300: "rgb(var(--c-brand-300) / <alpha-value>)",
          500: "rgb(var(--c-brand-500) / <alpha-value>)",
          600: "rgb(var(--c-brand-600) / <alpha-value>)",
          700: "rgb(var(--c-brand-700) / <alpha-value>)",
          900: "rgb(var(--c-brand-900) / <alpha-value>)",
        },
        spice: {
          DEFAULT: "#B7791F",
          50: "#FBF2E2",
          500: "#B7791F",
          600: "#96620F",
        },
        status: {
          green: "rgb(var(--c-green) / <alpha-value>)",
          greenBg: "rgb(var(--c-green-bg) / <alpha-value>)",
          amber: "rgb(var(--c-amber) / <alpha-value>)",
          amberBg: "rgb(var(--c-amber-bg) / <alpha-value>)",
          red: "rgb(var(--c-red) / <alpha-value>)",
          redBg: "rgb(var(--c-red-bg) / <alpha-value>)",
          blue: "rgb(var(--c-blue) / <alpha-value>)",
          blueBg: "rgb(var(--c-blue-bg) / <alpha-value>)",
          grey: "rgb(var(--c-grey) / <alpha-value>)",
          greyBg: "rgb(var(--c-grey-bg) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,24,31,0.06)",
        pop: "0 8px 24px rgba(18,24,31,0.12)",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};
