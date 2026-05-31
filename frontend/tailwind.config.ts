import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary — Deep Navy ──
        primary: {
          50: "#e8eaf4",
          100: "#c5cae4",
          200: "#9fa7d2",
          300: "#7884c0",
          400: "#5a6ab3",
          500: "#3d51a6",
          600: "#2e3f8f",
          700: "#1e2d72",
          800: "#111d58",
          900: "#0D1B4B", // base
          950: "#080f2e",
        },

        // ── Accent — Warm Coral Orange ──
        accent: {
          50: "#fff1ec",
          100: "#ffddd0",
          200: "#ffc0a8",
          300: "#ffa07e",
          400: "#ff7d52",
          500: "#F4622A", // base
          600: "#d94e1a",
          700: "#b33c10",
          800: "#8c2d09",
          900: "#661f04",
          950: "#3d1002",
        },

        // ── Neutrals ──
        background: "#FFFFFF",
        surface: "#F8F8F8",
        border: "#E5E5E5",

        // ── Text ──
        text: {
          primary: "#111111",
          secondary: "#717171",
          inverse: "#FFFFFF",
          muted: "#A3A3A3",
        },

        // ── Semantic ──
        success: {
          light: "#D1FAE5",
          base: "#059669",
          dark: "#064E3B",
        },
        warning: {
          light: "#FEF3C7",
          base: "#D97706",
          dark: "#78350F",
        },
        error: {
          light: "#FEE2E2",
          base: "#DC2626",
          dark: "#7F1D1D",
        },
        info: {
          light: "#DBEAFE",
          base: "#2563EB",
          dark: "#1E3A8A",
        },
      },

      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.375rem" }],
        base: ["1rem", { lineHeight: "1.625rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.375rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.75rem" }],
        "5xl": ["3rem", { lineHeight: "1.15" }],
      },

      borderRadius: {
        none: "0",
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },

      boxShadow: {
        sm: "0 1px 2px 0 rgb(13 27 75 / 0.06)",
        DEFAULT: "0 2px 8px 0 rgb(13 27 75 / 0.10)",
        md: "0 4px 16px 0 rgb(13 27 75 / 0.12)",
        lg: "0 8px 32px 0 rgb(13 27 75 / 0.14)",
        xl: "0 16px 48px 0 rgb(13 27 75 / 0.16)",
        accent: "0 4px 16px 0 rgb(244 98 42 / 0.30)",
        none: "none",
      },

      spacing: {
        touch: "44px",
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
      },

      transitionDuration: {
        DEFAULT: "200ms",
        fast: "100ms",
        slow: "400ms",
      },

      zIndex: {
        map: "10",
        overlay: "20",
        drawer: "30",
        modal: "40",
        toast: "50",
      },
    },
  },
  plugins: [],
};

export default config;
